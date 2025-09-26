// Test accounts creation script for Tackld
import { supabase } from '@/integrations/supabase/client';

const TEST_ACCOUNTS = [
  // Customer accounts
  {
    email: 'customer1@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'John Customer',
      phoneNumber: '+65 9123 4567',
      accountType: 'customer'
    }
  },
  {
    email: 'customer2@test.com', 
    password: 'TestPass123!',
    metadata: {
      fullName: 'Jane Customer',
      phoneNumber: '+65 9234 5678',
      accountType: 'customer'
    }
  },

  // Contractor accounts - Aircon (Saver + Tackler's Choice)
  {
    email: 'aircon.saver@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Ali Aircon Saver',
      phoneNumber: '+65 9345 6789',
      accountType: 'contractor',
      contractorType: 'saver',
      serviceType: 'aircon',
      companyName: 'Cool Breeze Services',
      bio: 'Expert aircon servicing at budget-friendly rates',
      yearsExperience: 5
    }
  },
  {
    email: 'aircon.tackler@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Ahmad Aircon Pro',
      phoneNumber: '+65 9456 7890',
      accountType: 'contractor',
      contractorType: 'tacklers_choice',
      serviceType: 'aircon',
      companyName: 'Premium Cool Tech',
      bio: 'Premium aircon solutions with quality guarantee',
      yearsExperience: 8
    }
  },

  // Contractor accounts - Plumbing
  {
    email: 'plumbing.saver@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Bob Plumber Saver',
      phoneNumber: '+65 9567 8901',
      accountType: 'contractor',
      contractorType: 'saver',
      serviceType: 'plumbing',
      companyName: 'Quick Fix Plumbing',
      bio: 'Affordable plumbing solutions for all your needs',
      yearsExperience: 6
    }
  },
  {
    email: 'plumbing.tackler@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Benjamin Pipe Pro',
      phoneNumber: '+65 9678 9012',
      accountType: 'contractor',
      contractorType: 'tacklers_choice',
      serviceType: 'plumbing',
      companyName: 'Elite Plumbing Solutions',
      bio: 'Premium plumbing services with 24/7 support',
      yearsExperience: 10
    }
  },

  // Contractor accounts - Electrical
  {
    email: 'electrical.saver@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Charlie Electric Saver',
      phoneNumber: '+65 9789 0123',
      accountType: 'contractor',
      contractorType: 'saver',
      serviceType: 'electrical',
      companyName: 'Spark & Save Electrical',
      bio: 'Budget electrical repairs and installations',
      yearsExperience: 4
    }
  },
  {
    email: 'electrical.tackler@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Chen Electric Pro',
      phoneNumber: '+65 9890 1234',
      accountType: 'contractor',
      contractorType: 'tacklers_choice',
      serviceType: 'electrical',
      companyName: 'PowerMax Electrical',
      bio: 'Professional electrical services with safety guarantee',
      yearsExperience: 12
    }
  },

  // Contractor accounts - Cleaning
  {
    email: 'cleaning.saver@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Diana Clean Saver',
      phoneNumber: '+65 9901 2345',
      accountType: 'contractor',
      contractorType: 'saver',
      serviceType: 'cleaning',
      companyName: 'Fresh & Clean Services',
      bio: 'Thorough cleaning services at affordable rates',
      yearsExperience: 3
    }
  },
  {
    email: 'cleaning.tackler@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Devi Premium Clean',
      phoneNumber: '+65 9012 3456',
      accountType: 'contractor',
      contractorType: 'tacklers_choice',
      serviceType: 'cleaning',
      companyName: 'Pristine Cleaning Co',
      bio: 'Premium cleaning with eco-friendly products',
      yearsExperience: 7
    }
  },

  // Contractor accounts - Painting
  {
    email: 'painting.saver@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Eddie Paint Saver',
      phoneNumber: '+65 9123 4567',
      accountType: 'contractor',
      contractorType: 'saver',
      serviceType: 'painting',
      companyName: 'Color Splash Painting',
      bio: 'Quality painting services at competitive prices',
      yearsExperience: 5
    }
  },
  {
    email: 'painting.tackler@test.com',
    password: 'TestPass123!',
    metadata: {
      fullName: 'Edwin Master Painter', 
      phoneNumber: '+65 9234 5678',
      accountType: 'contractor',
      contractorType: 'tacklers_choice',
      serviceType: 'painting',
      companyName: 'Artisan Paint Works',
      bio: 'Master painter with premium finishes guaranteed',
      yearsExperience: 15
    }
  }
];


export const createTestAccounts = async () => {
  console.log('🚀 Starting test account creation...');
  const results = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`Creating account: ${account.email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: account.metadata
        }
      });

      if (error) {
        console.error(`❌ Failed to create ${account.email}:`, error.message);
        results.push({ email: account.email, success: false, error: error.message });
      } else {
        console.log(`✅ Successfully created ${account.email}`);
        results.push({ email: account.email, success: true, id: data.user?.id });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error creating ${account.email}:`, error);
      results.push({ email: account.email, success: false, error: error.message });
    }
  }

  console.log('\n📊 Test Account Creation Summary:');
  console.log('================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} accounts`);
  console.log(`❌ Failed to create: ${failed.length} accounts`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Accounts:');
    successful.forEach(account => {
      console.log(`   - ${account.email}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Accounts:');
    failed.forEach(account => {
      console.log(`   - ${account.email}: ${account.error}`);
    });
  }

  console.log('\n🔑 Login Credentials:');
  console.log('Password for all accounts: TestPass123!');
  console.log('\n📝 Customer Accounts:');
  console.log('   - customer1@test.com');
  console.log('   - customer2@test.com');
  console.log('\n🔧 Contractor Accounts by Service:');
  console.log('   Aircon: aircon.saver@test.com, aircon.tackler@test.com');
  console.log('   Plumbing: plumbing.saver@test.com, plumbing.tackler@test.com');
  console.log('   Electrical: electrical.saver@test.com, electrical.tackler@test.com');
  console.log('   Cleaning: cleaning.saver@test.com, cleaning.tackler@test.com');
  console.log('   Painting: painting.saver@test.com, painting.tackler@test.com');

  return results;
};

// Make it available globally for console usage
if (typeof window !== 'undefined') {
  window.createTestAccounts = createTestAccounts;
  console.log('Run createTestAccounts() in the console to create all test accounts');
}