const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
}

// Create a function to get authenticated Supabase client
function getSupabaseClient(authToken = null) {
  if (authToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export both the default client and the function
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client using service role key for bypassing Row Level Security
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin, getSupabaseClient };
