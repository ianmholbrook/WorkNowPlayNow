const express = require('express');
const router = express.Router();

router.get('/config', (req, res) => {
  res.json({
    url: process.env.SUPABASE_URL || process.env.DATABASE,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.DATABASE_KEY,
  });
});

module.exports = router;
