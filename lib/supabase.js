require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Base client for general use (no user context)
const db = createClient(supabaseUrl, supabaseAnonKey);

// Creates a client authenticated as a specific user so RLS works correctly
function getAuthClient(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

module.exports = { db, getAuthClient };