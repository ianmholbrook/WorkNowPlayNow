const express = require('express');
const router = express.Router();
const db = require('../lib/supabase');
const { Task, categories } = require('../models/task');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /tasks - get all tasks for the signed-in user
router.get('/', async (req, res, next) => {
  const { data, error } = await db
    .from('tasks')
    .select('id, created_at, title, description, status, category, goal_id, due_date, reminder_time, reminder_sent, user_id')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return next(error);

  res.json({ tasks: data.map(Task.fromDB), categories });
});

// GET /tasks/:id - get a single task for the signed-in user
router.get('/:id', async (req, res, next) => {
  const { data, error } = await db
    .from('tasks')
    .select('id, created_at, title, description, status, category, goal_id, due_date, reminder_time, reminder_sent, user_id')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Task not found' });

  res.json(Task.fromDB(data));
});

// POST /tasks - create a new task for the signed-in user
router.post('/', async (req, res, next) => {
  const { title, description = '', category = null, goal_id = null, due_date = null, reminder_time = null } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await db
    .from('tasks')
    .insert([{
      user_id: req.user.id,
      title,
      description,
      category,
      goal_id,
      due_date,
      reminder_time,
      status: 'pending',
      reminder_sent: false,
    }])
    .select()
    .single();

  if (error) return next(error);

  res.status(201).json(Task.fromDB(data));
});

// PUT /tasks/:id - update a task for the signed-in user
router.put('/:id', async (req, res, next) => {
  const { title, description, status, category, goal_id, due_date, reminder_time } = req.body;

  const updates = {};
  if (title !== undefined)         updates.title = title;
  if (description !== undefined)   updates.description = description;
  if (status !== undefined)        updates.status = status;
  if (category !== undefined)      updates.category = category;
  if (goal_id !== undefined)       updates.goal_id = goal_id;
  if (due_date !== undefined)      updates.due_date = due_date;
  if (reminder_time !== undefined) updates.reminder_time = reminder_time;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  const { data, error } = await db
    .from('tasks')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Task not found' });

  res.json(Task.fromDB(data));
});

// DELETE /tasks/:id - delete a task for the signed-in user
router.delete('/:id', async (req, res, next) => {
  const { error, count } = await db
    .from('tasks')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return next(error);
  if (count === 0) return res.status(404).json({ error: 'Task not found' });

  res.status(204).send();
});

module.exports = router;