const express = require('express');
const router = express.Router();
const db = require('../lib/supabase');
const { categories } = require('../models/task');
const requireAuth = require('../middlewares/auth');

// To make tasks user-specific, add a user_id column to the Supabase tasks table:
// user_id UUID REFERENCES auth.users(id)
router.use(requireAuth);

// GET /tasks - display only the signed-in user's tasks
router.get('/', async (req, res) => {
  const { data, error } = await db
    .from('tasks')
    .select('id,name,category,description,completed,created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Unable to load tasks' });
  }

  res.json({ tasks: data ?? [], categories });
});

// POST /tasks - add task for the signed-in user
router.post('/', async (req, res) => {
  const { name, category, description = '' } = req.body;
  const categoryId = category !== undefined && category !== '' ? Number(category) : null;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (categoryId !== null && Number.isNaN(categoryId)) {
    return res.status(400).json({ error: 'Category must be a valid number' });
  }

  const { data, error } = await db
    .from('tasks')
    .insert([
      {
        user_id: req.user.id,
        name,
        category: categoryId,
        description,
        completed: false,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: 'Unable to save task' });
  }

  res.status(201).json(data[0]);
});

// PUT /tasks/:id/complete - mark a task complete for the signed-in user
router.put('/:id/complete', async (req, res) => {
  const { data, error } = await db
    .from('tasks')
    .update({ completed: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    return res.status(500).json({ error: 'Unable to update task' });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(data[0]);
});

module.exports = router;
