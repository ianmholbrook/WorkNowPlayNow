const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const { Goal, GoalProgress } = require('../models/goal');
const { awardPoints } = require('../lib/points');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /goals
router.get('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('goals')
    .select(`id, created_at, title, description, completed, user_id,
      goal_progress ( id, percent_complete, updated_at )`)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return next(error);
  res.json({ goals: data.map(row => ({
    ...Goal.fromDB(row).toJSON(),
    progress: row.goal_progress?.at(-1) ?? null,
  }))});
});

// GET /goals/:id
router.get('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('goals')
    .select(`id, created_at, title, description, completed, user_id,
      goal_progress ( id, percent_complete, updated_at )`)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Goal not found' });
  res.json({ ...Goal.fromDB(data).toJSON(), progress_history: data.goal_progress ?? [] });
});

// POST /goals
router.post('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const { data, error } = await db
    .from('goals')
    .insert([{ user_id: req.user.id, title, description, completed: false }])
    .select()
    .single();

  if (error) return next(error);
  res.status(201).json(Goal.fromDB(data));
});

// PUT /goals/:id
router.put('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title, description, completed } = req.body;

  const updates = {};
  if (title !== undefined)       updates.title = title;
  if (description !== undefined) updates.description = description;
  if (completed !== undefined)   updates.completed = completed;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  const { data, error } = await db
    .from('goals')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Goal not found' });

  let pointsAwarded = null;
  if (completed === true) {
    try {
      pointsAwarded = await awardPoints(req.user.id, 'goal', data.id, req.token);
    } catch (err) {
      console.error('Points award failed:', err.message);
    }
  }

  res.json({ ...Goal.fromDB(data).toJSON(), pointsAwarded });
});

// DELETE /goals/:id
router.delete('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { error } = await db
    .from('goals')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return next(error);
  res.status(204).send();
});

// POST /goals/:id/progress
router.post('/:id/progress', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { percent_complete } = req.body;

  if (percent_complete === undefined || percent_complete === null) {
    return res.status(400).json({ error: 'percent_complete is required' });
  }

  const value = Number(percent_complete);
  if (isNaN(value) || value < 0 || value > 100) {
    return res.status(400).json({ error: 'percent_complete must be a number between 0 and 100' });
  }

  const { data: goal, error: goalError } = await db
    .from('goals')
    .select('id, completed')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (goalError || !goal) return res.status(404).json({ error: 'Goal not found' });

  const { data, error } = await db
    .from('goal_progress')
    .insert([{ goal_id: req.params.id, percent_complete: value, updated_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) return next(error);

  let pointsAwarded = null;
  if (value === 100 && !goal.completed) {
    await db.from('goals').update({ completed: true }).eq('id', req.params.id);
    try {
      pointsAwarded = await awardPoints(req.user.id, 'goal', req.params.id, req.token);
    } catch (err) {
      console.error('Points award failed:', err.message);
    }
  }

  res.status(201).json({ ...GoalProgress.fromDB(data).toJSON(), pointsAwarded });
});

module.exports = router;