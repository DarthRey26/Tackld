import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Initialize regular client to check admin status
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.account_type !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Parse request body
    const { 
      email, 
      password, 
      fullName, 
      phoneNumber, 
      serviceType, 
      contractorType, 
      companyName, 
      bio 
    } = await req.json()

    // Validate required fields
    if (!email || !password || !fullName || !phoneNumber || !serviceType || !contractorType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, password, fullName, phoneNumber, serviceType, contractorType' 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate contractor_type
    if (!['saver', 'tacklers_choice'].includes(contractorType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid contractor type. Must be either "saver" or "tacklers_choice"' 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Creating contractor account for:', email)

    // Create the auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        fullName,
        phoneNumber,
        accountType: 'contractor',
        contractorType,
        serviceType,
        companyName: companyName || null,
        bio: bio || null,
        yearsExperience: 0
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message || 'Failed to create auth user' 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create user - no user data returned' 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Auth user created:', authData.user.id)

    // The profile should be automatically created by the trigger, but let's verify
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: createdProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !createdProfile) {
      console.error('Profile verification error:', profileError)
      // Try to clean up the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create contractor profile - user has been removed' 
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('Profile created successfully:', createdProfile.id)

    // Log the admin action
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action: 'create_contractor_account',
        target_user_id: authData.user.id,
        details: {
          email,
          name: fullName,
          service_type: serviceType,
          contractor_type: contractorType,
          created_with_credentials: true
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contractor account created successfully with login credentials',
        contractor_id: authData.user.id,
        profile: createdProfile
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})