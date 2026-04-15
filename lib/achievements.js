const { getAuthClient, db: adminDb } = require('./supabase');
const { awardPoints, getTotalPoints } = require('./points');

// ── Fetch all achievement definitions (cached at module level) ────────────────
let _achievementCache = null;
async function getAllAchievements() {
  if (_achievementCache) return _achievementCache;
  const { data, error } = await adminDb.from('achievements').select('*');
  if (error) throw error;
  _achievementCache = data;
  return data;
}

// ── Fetch achievement IDs already unlocked by user ────────────────────────────
async function getUnlockedIds(userId, token) {
  const db = getAuthClient(token);
  const { data, error } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set(data.map(r => r.achievement_id));
}

// ── Unlock a single achievement and award its points ──────────────────────────
async function unlockAchievement(userId, achievement, token) {
  const db = getAuthClient(token);

  const { error } = await db
    .from('user_achievements')
    .insert([{ user_id: userId, achievement_id: achievement.id }]);

  if (error) {
    if (error.code === '23505' || error.message?.includes('unique')) return null;
    throw error;
  }

  let pointsAwarded = null;
  try {
    pointsAwarded = await awardPoints(
      userId, 'achievement', achievement.id, token, achievement.points
    );
  } catch (err) {
    console.error('Achievement points award failed:', err.message);
  }

  return { achievement, pointsAwarded };
}

// ── Master check ──────────────────────────────────────────────────────────────
async function checkAchievements(userId, token, actionType, context = {}) {
  const [all, unlockedIds] = await Promise.all([
    getAllAchievements(),
    getUnlockedIds(userId, token),
  ]);

  const locked = all.filter(a => !unlockedIds.has(a.id));
  const newly  = [];

  for (const achievement of locked) {
    try {
      const earned = await shouldUnlock(achievement, userId, token, actionType, context);
      if (earned) {
        const result = await unlockAchievement(userId, achievement, token);
        if (result) newly.push(result);
      }
    } catch (err) {
      console.error(`Achievement check failed for ${achievement.key}:`, err.message);
    }
  }

  return newly;
}

// ── Per-achievement unlock logic ──────────────────────────────────────────────
async function shouldUnlock(achievement, userId, token, actionType, context) {
  const db = getAuthClient(token);

  switch (achievement.key) {

    // ── Streak ──
    case 'streak_3':
    case 'streak_7':
    case 'streak_30':
    case 'streak_100':
    case 'streak_365': {
      if (actionType !== 'login') return false;
      const required = parseInt(achievement.key.split('_')[1]);
      return (context.current_streak ?? 0) >= required;
    }

    // ── Tasks completed (cumulative) ──
    case 'tasks_1':
    case 'tasks_10':
    case 'tasks_50':
    case 'tasks_100':
    case 'tasks_500':
    case 'tasks_1000': {
      if (actionType !== 'task_complete') return false;
      const required = parseInt(achievement.key.split('_')[1]);
      const { count, error } = await db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (error) return false;
      return (count ?? 0) >= required;
    }

    // ── Goals completed (cumulative) ──
    case 'goals_1':
    case 'goals_5':
    case 'goals_10':
    case 'goals_25':
    case 'goals_50': {
      if (actionType !== 'goal_complete') return false;
      const required = parseInt(achievement.key.split('_')[1]);
      const { count, error } = await db
        .from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);
      if (error) return false;
      return (count ?? 0) >= required;
    }

    // ── Points earned (cumulative) ──
    case 'points_100':
    case 'points_500':
    case 'points_1000':
    case 'points_5000':
    case 'points_10000': {
      if (actionType !== 'points_updated') return false;
      const required = parseInt(achievement.key.split('_')[1]);
      const total = await getTotalPoints(userId, token);
      return total >= required;
    }

    // ── Daily hustle (tasks completed today) ──
    case 'daily_5':
    case 'daily_10':
    case 'daily_20': {
      if (actionType !== 'task_complete') return false;
      const required = parseInt(achievement.key.split('_')[1]);
      const today = new Date().toISOString().slice(0, 10);
      const { count, error } = await db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', `${today}T00:00:00`)
        .lte('updated_at', `${today}T23:59:59`);
      if (error) return false;
      return (count ?? 0) >= required;
    }

    // ── Speed: complete within 1 hour of creation ──
    case 'speed_1hour': {
      if (actionType !== 'task_complete') return false;
      if (!context.task) return false;
      const created   = new Date(context.task.created_at).getTime();
      const completed = Date.now();
      return (completed - created) <= 60 * 60 * 1000;
    }

    case 'speed_10': {
      if (actionType !== 'task_complete') return false;
      const { data, error } = await db
        .from('tasks')
        .select('created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (error || !data) return false;
      const quickCount = data.filter(t => {
        const diff = new Date(t.updated_at) - new Date(t.created_at);
        return diff <= 60 * 60 * 1000;
      }).length;
      return quickCount >= 10;
    }

    // ── Early bird ──
    case 'early_bird': {
      if (actionType !== 'task_complete') return false;
      return new Date().getHours() < 8;
    }

    // ── Night owl ──
    case 'night_owl': {
      if (actionType !== 'task_complete') return false;
      return new Date().getHours() >= 23;
    }

    default:
      return false;
  }
}

// ── Public helpers ────────────────────────────────────────────────────────────

async function getAchievementsForUser(userId, token) {
  const [all, unlockedRows] = await Promise.all([
    getAllAchievements(),
    (async () => {
      const db = getAuthClient(token);
      const { data, error } = await db
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);
      if (error) throw error;
      return data ?? [];
    })(),
  ]);

  const unlockedMap = new Map(unlockedRows.map(r => [r.achievement_id, r.unlocked_at]));

  return all.map(a => ({
    ...a,
    unlocked:    unlockedMap.has(a.id),
    unlocked_at: unlockedMap.get(a.id) ?? null,
  }));
}

async function getUnlockedCount(userId, token) {
  const db = getAuthClient(token);
  const { count, error } = await db
    .from('user_achievements')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

module.exports = { checkAchievements, getAchievementsForUser, getUnlockedCount };