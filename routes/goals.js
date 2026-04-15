const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const { Goal } = require('../models/goal');
const { awardPoints } = require('../lib/points');
const { checkAchievements } = require('../lib/achievements');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /goals
router.get('/', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('goals')
    .select('id, created_at, title, description, completed, completed_at, user_id')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return next(error);
  res.json({ goals: data.map(row => Goal.fromDB(row).toJSON()) });
});

// GET /goals/:id
router.get('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { data, error } = await db
    .from('goals')
    .select('id, created_at, title, description, completed, completed_at, user_id')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return next(error);
  if (!data) return res.status(404).json({ error: 'Goal not found' });
  res.json(Goal.fromDB(data).toJSON());
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
  res.status(201).json({ goal: Goal.fromDB(data).toJSON() });
});

// PUT /goals/:id
router.put('/:id', async (req, res, next) => {
  const db = getAuthClient(req.token);
  const { title, description, completed, completed_at } = req.body;

  const updates = {};
  if (title !== undefined)        updates.title = title;
  if (description !== undefined)  updates.description = description;
  if (completed !== undefined)    updates.completed = completed;
  if (completed_at !== undefined) updates.completed_at = completed_at;

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
  let newAchievements = [];

  if (completed === true) {
    try {
      pointsAwarded = await awardPoints(req.user.id, 'goal', data.id, req.token);
    } catch (err) {
      console.error('Points award failed:', err.message);
    }

    try {
      const goalAchievements = await checkAchievements(
        req.user.id, req.token, 'goal_complete', {}
      );
      const pointsAchievements = await checkAchievements(
        req.user.id, req.token, 'points_updated', {}
      );
      newAchievements = [...goalAchievements, ...pointsAchievements];
    } catch (err) {
      console.error('Achievement check failed:', err.message);
    }
  }

  res.json({ ...Goal.fromDB(data).toJSON(), pointsAwarded, newAchievements });
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

module.exports = router;