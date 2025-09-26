export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          access_instructions: string | null
          building_name: string | null
          city: string
          contact_person: Json | null
          country: string
          created_at: string | null
          floor_number: string | null
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          postal_code: string
          unit_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_instructions?: string | null
          building_name?: string | null
          city?: string
          contact_person?: Json | null
          country?: string
          created_at?: string | null
          floor_number?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          postal_code: string
          unit_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_instructions?: string | null
          building_name?: string | null
          city?: string
          contact_person?: Json | null
          country?: string
          created_at?: string | null
          floor_number?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          postal_code?: string
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      appeals: {
        Row: {
          admin_response: string | null
          appeal_type: string
          booking_id: string
          created_at: string
          customer_id: string
          evidence_photos: string[] | null
          extra_part_id: string | null
          id: string
          reason: string
          resolution_amount: number | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          appeal_type?: string
          booking_id: string
          created_at?: string
          customer_id: string
          evidence_photos?: string[] | null
          extra_part_id?: string | null
          id?: string
          reason: string
          resolution_amount?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          appeal_type?: string
          booking_id?: string
          created_at?: string
          customer_id?: string
          evidence_photos?: string[] | null
          extra_part_id?: string | null
          id?: string
          reason?: string
          resolution_amount?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          booking_id: string
          contractor_id: string
          created_at: string | null
          customer_response: Json | null
          eta_minutes: number
          expires_at: string | null
          id: string
          included_materials: Json | null
          note: string | null
          proposed_end_time: string | null
          proposed_start_time: string | null
          status: string
          terms: Json | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          contractor_id: string
          created_at?: string | null
          customer_response?: Json | null
          eta_minutes: number
          expires_at?: string | null
          id?: string
          included_materials?: Json | null
          note?: string | null
          proposed_end_time?: string | null
          proposed_start_time?: string | null
          status?: string
          terms?: Json | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          contractor_id?: string
          created_at?: string | null
          customer_response?: Json | null
          eta_minutes?: number
          expires_at?: string | null
          id?: string
          included_materials?: Json | null
          note?: string | null
          proposed_end_time?: string | null
          proposed_start_time?: string | null
          status?: string
          terms?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "contractor_available_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bids_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bids_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "contractor_available_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_logs: {
        Row: {
          booking_id: string
          service_type: string | null
          status: string | null
          timestamp: string | null
          user_email: string
        }
        Insert: {
          booking_id: string
          service_type?: string | null
          status?: string | null
          timestamp?: string | null
          user_email: string
        }
        Update: {
          booking_id?: string
          service_type?: string | null
          status?: string | null
          timestamp?: string | null
          user_email?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          additional_parts: Json | null
          address: Json
          after_photos: string[] | null
          asap: boolean | null
          before_photos: string[] | null
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contractor_id: string | null
          created_at: string | null
          current_stage: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          description: string | null
          during_photos: string[] | null
          escrow_amount: number | null
          escrow_status: string | null
          estimated_price: number | null
          extra_parts: Json | null
          final_price: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          photos: Json | null
          price_range_max: number | null
          price_range_min: number | null
          progress: Json | null
          reschedule_request: Json | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_answers: Json | null
          service_id: string | null
          service_questions: Json | null
          service_type: string
          stage_photos: Json | null
          status: string
          updated_at: string | null
          uploaded_images: string[] | null
          urgency: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          additional_parts?: Json | null
          address: Json
          after_photos?: string[] | null
          asap?: boolean | null
          before_photos?: string[] | null
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contractor_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          during_photos?: string[] | null
          escrow_amount?: number | null
          escrow_status?: string | null
          estimated_price?: number | null
          extra_parts?: Json | null
          final_price?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          photos?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          progress?: Json | null
          reschedule_request?: Json | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_answers?: Json | null
          service_id?: string | null
          service_questions?: Json | null
          service_type: string
          stage_photos?: Json | null
          status?: string
          updated_at?: string | null
          uploaded_images?: string[] | null
          urgency?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          additional_parts?: Json | null
          address?: Json
          after_photos?: string[] | null
          asap?: boolean | null
          before_photos?: string[] | null
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contractor_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          during_photos?: string[] | null
          escrow_amount?: number | null
          escrow_status?: string | null
          estimated_price?: number | null
          extra_parts?: Json | null
          final_price?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          photos?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          progress?: Json | null
          reschedule_request?: Json | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_answers?: Json | null
          service_id?: string | null
          service_questions?: Json | null
          service_type?: string
          stage_photos?: Json | null
          status?: string
          updated_at?: string | null
          uploaded_images?: string[] | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_contractor_id"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_parts: {
        Row: {
          action_timestamp: string | null
          booking_id: string
          created_at: string
          customer_action: string | null
          customer_notes: string | null
          id: string
          part_name: string
          photo_url: string | null
          quantity: number
          reason: string | null
          status: string
          total_price: number
          unit_price: number
        }
        Insert: {
          action_timestamp?: string | null
          booking_id: string
          created_at?: string
          customer_action?: string | null
          customer_notes?: string | null
          id?: string
          part_name: string
          photo_url?: string | null
          quantity?: number
          reason?: string | null
          status?: string
          total_price: number
          unit_price: number
        }
        Update: {
          action_timestamp?: string | null
          booking_id?: string
          created_at?: string
          customer_action?: string | null
          customer_notes?: string | null
          id?: string
          part_name?: string
          photo_url?: string | null
          quantity?: number
          reason?: string | null
          status?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "extra_parts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_parts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "contractor_available_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          bio: string | null
          company_name: string | null
          contractor_type: string | null
          created_at: string | null
          customer_address: Json | null
          earnings_total: number | null
          email: string
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          jobs_forfeited: number | null
          phone_number: string | null
          profile_photo_url: string | null
          rating: number | null
          service_area: string[] | null
          service_type: string | null
          success_rate: number | null
          total_bids_submitted: number | null
          total_jobs: number | null
          total_jobs_completed: number | null
          total_jobs_forfeited: number | null
          total_reviews: number | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          account_type?: string
          bio?: string | null
          company_name?: string | null
          contractor_type?: string | null
          created_at?: string | null
          customer_address?: Json | null
          earnings_total?: number | null
          email: string
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          is_available?: boolean | null
          is_verified?: boolean | null
          jobs_forfeited?: number | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          service_area?: string[] | null
          service_type?: string | null
          success_rate?: number | null
          total_bids_submitted?: number | null
          total_jobs?: number | null
          total_jobs_completed?: number | null
          total_jobs_forfeited?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          account_type?: string
          bio?: string | null
          company_name?: string | null
          contractor_type?: string | null
          created_at?: string | null
          customer_address?: Json | null
          earnings_total?: number | null
          email?: string
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          jobs_forfeited?: number | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          service_area?: string[] | null
          service_type?: string | null
          success_rate?: number | null
          total_bids_submitted?: number | null
          total_jobs?: number | null
          total_jobs_completed?: number | null
          total_jobs_forfeited?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      reschedule_requests: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          new_date: string
          new_time: string
          reason: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          new_date: string
          new_time: string
          reason: string
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          new_date?: string
          new_time?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "contractor_available_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          contractor_id: string
          contractor_response: string | null
          contractor_response_date: string | null
          created_at: string | null
          customer_id: string
          id: string
          professionalism_rating: number | null
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          review_date: string | null
          review_text: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          contractor_id: string
          contractor_response?: string | null
          contractor_response_date?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          review_date?: string | null
          review_text?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          contractor_id?: string
          contractor_response?: string | null
          contractor_response_date?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          review_date?: string | null
          review_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "contractor_available_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          average_rating: number | null
          category: string
          created_at: string | null
          default_price_max: number | null
          default_price_min: number | null
          description: string | null
          estimated_duration_max: number | null
          estimated_duration_min: number | null
          id: string
          is_active: boolean | null
          name: string
          questions: Json | null
          requirements: string[] | null
          tags: string[] | null
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          category: string
          created_at?: string | null
          default_price_max?: number | null
          default_price_min?: number | null
          description?: string | null
          estimated_duration_max?: number | null
          estimated_duration_min?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json | null
          requirements?: string[] | null
          tags?: string[] | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          created_at?: string | null
          default_price_max?: number | null
          default_price_min?: number | null
          description?: string | null
          estimated_duration_max?: number | null
          estimated_duration_min?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json | null
          requirements?: string[] | null
          tags?: string[] | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      contractor_available_jobs: {
        Row: {
          address: Json | null
          asap: boolean | null
          booking_type: string | null
          contractor_id: string | null
          created_at: string | null
          current_stage: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string | null
          price_range_max: number | null
          price_range_min: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_answers: Json | null
          service_type: string | null
          status: string | null
          uploaded_images: string[] | null
          urgency: string | null
        }
        Insert: {
          address?: Json | null
          asap?: boolean | null
          booking_type?: string | null
          contractor_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          description?: string | null
          id?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_answers?: Json | null
          service_type?: string | null
          status?: string | null
          uploaded_images?: string[] | null
          urgency?: string | null
        }
        Update: {
          address?: Json | null
          asap?: boolean | null
          booking_type?: string | null
          contractor_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          description?: string | null
          id?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_answers?: Json | null
          service_type?: string | null
          status?: string | null
          uploaded_images?: string[] | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bookings_contractor_id"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_bid_atomic: {
        Args: { bid_id_param: string; customer_id_param: string }
        Returns: Json
      }
      cleanup_expired_bids: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      complete_payment_atomic: {
        Args: { booking_id_param: string; payment_method_param?: string }
        Returns: Json
      }
      create_contractor_account: {
        Args: {
          bio?: string
          company_name?: string
          contractor_email: string
          contractor_name: string
          contractor_phone: string
          contractor_type: string
          service_type: string
        }
        Returns: Json
      }
      get_contractor_dashboard: {
        Args: { contractor_id_param: string }
        Returns: Json
      }
      get_enhanced_contractor_dashboard: {
        Args: { contractor_id_param: string }
        Returns: Json
      }
      get_user_account_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_extra_parts_customer_action: {
        Args: {
          action_param: string
          customer_id_param: string
          notes_param?: string
          part_id_param: string
        }
        Returns: Json
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      reject_bid_atomic: {
        Args: {
          bid_id_param: string
          customer_id_param: string
          reason_param?: string
        }
        Returns: Json
      }
      submit_bid_atomic: {
        Args: {
          amount_param: number
          booking_id_param: string
          contractor_id_param: string
          eta_minutes_param: number
          materials_param?: Json
          note_param?: string
        }
        Returns: Json
      }
      update_booking_stage_with_photos: {
        Args: {
          booking_id_param: string
          contractor_id_param: string
          new_stage: string
          photo_urls?: string[]
          stage_type?: string
        }
        Returns: Json
      }
    }
    Enums: {
      job_stage:
        | "pending_bids"
        | "finding_contractor"
        | "contractor_assigned"
        | "arriving"
        | "work_started"
        | "in_progress"
        | "work_completed"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_stage: [
        "pending_bids",
        "finding_contractor",
        "contractor_assigned",
        "arriving",
        "work_started",
        "in_progress",
        "work_completed",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
