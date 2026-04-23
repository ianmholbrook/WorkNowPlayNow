const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const { Task } = require('../models/task');
const { awardPoints } = require('../lib/points');
const { checkAchievements } = require('../lib/achievements');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('tasks')
    .select('id, created_at, title, description, status, category_id, goal_id, due_date, reminder_time, reminder_sent, user_id, subtasks (id, title, completed, created_at)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return next(error);
  res.json({ tasks: data.map(Task.fromDB) });
});

router.get('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('tasks')
    .select('id, created_at, title, description, status, category_id, goal_id, due_date, reminder_time, reminder_sent, user_id, subtasks (id, title, completed, created_at)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Task not found' });
  res.json(Task.fromDB(data));
});

router.post('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title, description = '', category_id = null, goal_id = null, due_date = null, reminder_time = null } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const { data, error } = await db
    .from('tasks')
    .insert([{
      user_id: req.user.id,
      title,
      description,
      category_id,
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

router.put('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title, description, status, category_id, goal_id, due_date, reminder_time, calendar_event_id } = req.body;
  const updates = {};
  if (title !== undefined)             updates.title             = title;
  if (description !== undefined)       updates.description       = description;
  if (status !== undefined)            updates.status            = status;
  if (category_id !== undefined)       updates.category_id       = category_id;
  if (goal_id !== undefined)           updates.goal_id           = goal_id;
  if (due_date !== undefined)          updates.due_date          = due_date;
  if (reminder_time !== undefined)     updates.reminder_time     = reminder_time;
  if (calendar_event_id !== undefined) updates.calendar_event_id = calendar_event_id;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields provided to update' });

  const { data, error } = await db
    .from('tasks')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Task not found' });

  let pointsAwarded  = null;
  let newAchievements = [];

  if (status === 'completed') {
    try {
      pointsAwarded = await awardPoints(req.user.id, 'task', data.id, req.token);
    } catch (err) {
      console.error('Points award failed:', err.message);
    }
    try {
      const taskAchievements   = await checkAchievements(req.user.id, req.token, 'task_complete', { task: data });
      const pointsAchievements = await checkAchievements(req.user.id, req.token, 'points_updated', {});
      newAchievements = [...taskAchievements, ...pointsAchievements];
    } catch (err) {
      console.error('Achievement check failed:', err.message);
    }
  }

  res.json({ ...Task.fromDB(data).toJSON(), pointsAwarded, newAchievements });
});

router.delete('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { error } = await db
    .from('tasks')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return next(error);
  res.status(204).send();
});

module.exports = router;