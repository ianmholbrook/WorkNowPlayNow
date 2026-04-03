const supa = require('supabase');
export database = supa.createClient(process.env.DATABASE, process.env.DATABASE_KEY);
