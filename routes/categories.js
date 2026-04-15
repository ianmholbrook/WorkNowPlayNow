const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /categories - get default categories + user's custom ones
router.get('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('categories')
    .select('id, name, is_default, user_id')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) return next(error);
  res.json({ categories: data ?? [] });
});

// POST /categories - create a custom category for the signed-in user
router.post('/', async (req, res, next) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('categories')
    .insert([{ name, user_id: req.user.id, is_default: false }])
    .select()
    .single();

  if (error) return next(error);
  res.status(201).json(data);
});

// DELETE /categories/:id - delete a custom category (own only)
router.delete('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id); // RLS also enforces this

  if (error) return next(error);
  res.status(204).send();
});

module.exports = router;