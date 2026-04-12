const express = require('express');
const router = express.Router();
const db = require('../lib/supabase');
const { Goal, GoalProgress } = require('../models/goal');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /goals - get all goals for the signed-in user (with latest progress)
router.get('/', async (req, res, next) => {
  const { data, error } = await db
    .from('goals')
    .select(`
      id, created_at, title, description, completed, user_id,
      goal_progress ( id, percent_complete, updated_at )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return next(error);

  res.json({ goals: data.map(row => ({
    ...Goal.fromDB(row).toJSON(),
    progress: row.goal_progress?.at(-1) ?? null,
  }))});
});

// GET /goals/:id - get a single goal with full progress history
router.get('/:id', async (req, res, next) => {
  const { data, error } = await db
    .from('goals')
    .select(`
      id, created_at, title, description, completed, user_id,
      goal_progress ( id, percent_complete, updated_at )
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Goal not found' });

  res.json({
    ...Goal.fromDB(data).toJSON(),
    progress_history: data.goal_progress ?? [],
  });
});

// POST /goals - create a new goal
router.post('/', async (req, res, next) => {
  const { title, description = '' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await db
    .from('goals')
    .insert([{
      user_id: req.user.id,
      title,
      description,
      completed: false,
    }])
    .select()
    .single();

  if (error) return next(error);

  res.status(201).json(Goal.fromDB(data));
});

// PUT /goals/:id - update a goal's title, description, or completed status
router.put('/:id', async (req, res, next) => {
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

  res.json(Goal.fromDB(data));
});

// DELETE /goals/:id - delete a goal (cascades to goal_progress)
router.delete('/:id', async (req, res, next) => {
  const { error } = await db
    .from('goals')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return next(error);

  res.status(204).send();
});

// POST /goals/:id/progress - record a new progress entry for a goal
router.post('/:id/progress', async (req, res, next) => {
  const { percent_complete } = req.body;

  if (percent_complete === undefined || percent_complete === null) {
    return res.status(400).json({ error: 'percent_complete is required' });
  }

  const value = Number(percent_complete);
  if (isNaN(value) || value < 0 || value > 100) {
    return res.status(400).json({ error: 'percent_complete must be a number between 0 and 100' });
  }

  // Verify the goal belongs to this user before logging progress
  const { data: goal, error: goalError } = await db
    .from('goals')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (goalError || !goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { data, error } = await db
    .from('goal_progress')
    .insert([{
      goal_id: req.params.id,
      percent_complete: value,
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return next(error);

  // Auto-complete the goal if progress hits 100%
  if (value === 100) {
    await db
      .from('goals')
      .update({ completed: true })
      .eq('id', req.params.id);
  }

  res.status(201).json(GoalProgress.fromDB(data));
});

module.exports = router;