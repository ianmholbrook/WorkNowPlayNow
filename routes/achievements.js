const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../lib/supabase');
const { getAchievementsForUser, getUnlockedCount } = require('../lib/achievements');
const { getTotalPoints } = require('../lib/points');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /achievements
// Returns all achievements with unlocked status AND user progress context
// so the frontend can render accurate progress bars on locked achievements
router.get('/', async (req, res, next) => {
  try {
    const db = getAuthClient(req.token);
    const userId = req.user.id;

    // Fetch achievements and all needed user stats in parallel
    const [
      achievements,
      tasksResult,
      goalsResult,
      streakResult,
      totalPoints,
      todayTasksResult,
      quickTasksResult,
    ] = await Promise.all([
      getAchievementsForUser(userId, req.token),

      // Total completed tasks
      db.from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),

      // Total completed goals
      db.from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true),

      // Current streak
      db.from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .maybeSingle(),

      // Total points
      getTotalPoints(userId, req.token),

      // Tasks completed today
      db.from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', new Date().toISOString().slice(0, 10) + 'T00:00:00')
        .lte('updated_at', new Date().toISOString().slice(0, 10) + 'T23:59:59'),

      // Tasks completed within 1 hour of creation (for speed achievements)
      db.from('tasks')
        .select('created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'completed'),
    ]);

    const quickCount = (quickTasksResult.data ?? []).filter(t => {
      const diff = new Date(t.updated_at) - new Date(t.created_at);
      return diff <= 60 * 60 * 1000;
    }).length;

    const progress = {
      streak:     streakResult.data?.current_streak ?? 0,
      tasks:      tasksResult.count ?? 0,
      goals:      goalsResult.count ?? 0,
      points:     totalPoints ?? 0,
      tasksToday: todayTasksResult.count ?? 0,
      quickTasks: quickCount,
    };

    res.json({ achievements, progress });
  } catch (err) {
    next(err);
  }
});

// GET /achievements/count
router.get('/count', async (req, res, next) => {
  try {
    const count = await getUnlockedCount(req.user.id, req.token);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;