const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET all subtasks for a task
router.get('/task/:taskId', async (req, res, next) => {
  const db = getAuthClient(req.token);

  const { data, error } = await db
    .from('subtasks')
    .select('id, title, completed, created_at, task_id')
    .eq('task_id', req.params.taskId)
    .order('created_at', { ascending: true });

  if (error) return next(error);
  res.json({ subtasks: data });
});

// CREATE subtask
router.post('/task/:taskId', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const { data, error } = await db
    .from('subtasks')
    .insert([
      {
        task_id: req.params.taskId,
        title,
        completed: false,
      },
    ])
    .select()
    .single();

  if (error) return next(error);
  res.status(201).json(data);
});

// UPDATE subtask (toggle complete)
router.put('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { completed } = req.body;

  const { data, error } = await db
    .from('subtasks')
    .update({ completed })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return next(error);
  res.json(data);
});

// DELETE subtask
router.delete('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);

  const { error } = await db
    .from('subtasks')
    .delete()
    .eq('id', req.params.id);

  if (error) return next(error);
  res.status(204).send();
});

module.exports = router;