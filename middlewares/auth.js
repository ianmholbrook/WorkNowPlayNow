const { db } = require('../lib/supabase');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = data.user;
  req.token = token; // Pass token along so routes can build an auth client
  next();
}

module.exports = requireAuth;