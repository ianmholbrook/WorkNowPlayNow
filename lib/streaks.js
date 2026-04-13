const { getAuthClient } = require('./supabase');
const { awardPoints } = require('./points');

const STREAK_MILESTONES = [
  { days: 5,   points: 25  },
  { days: 30,  points: 100 },
  { days: 100, points: 500 },
];

async function recordLogin(userId, token) {
  const db = getAuthClient(token);
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: fetchError } = await db
    .from('user_streaks')
    .select('id, current_streak, longest_streak, last_login_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing?.last_login_date === today) {
    return {
      current_streak: existing.current_streak,
      longest_streak: existing.longest_streak,
      milestoneReached: null,
      pointsAwarded: null,
    };
  }

  let current_streak = 1;
  const longest_streak = existing?.longest_streak ?? 0;

  if (existing?.last_login_date) {
    const last = new Date(existing.last_login_date);
    const now  = new Date(today);
    const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
    current_streak = diffDays === 1 ? (existing.current_streak ?? 0) + 1 : 1;
  }

  const new_longest = Math.max(current_streak, longest_streak);

  const { error: upsertError } = await db
    .from('user_streaks')
    .upsert({
      user_id: userId,
      current_streak,
      longest_streak: new_longest,
      last_login_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (upsertError) throw upsertError;

  let milestoneReached = null;
  let pointsAwarded = null;

  const milestone = STREAK_MILESTONES.find(m => m.days === current_streak);
  if (milestone) {
    milestoneReached = milestone.days;
    try {
      pointsAwarded = await awardPoints(userId, 'task', `streak-${milestone.days}-${today}`, token);
    } catch (err) {
      console.error('Streak milestone points award failed:', err.message);
    }
  }

  return { current_streak, longest_streak: new_longest, milestoneReached, pointsAwarded };
}

async function getStreak(userId, token) {
  const db = getAuthClient(token);
  const { data, error } = await db
    .from('user_streaks')
    .select('current_streak, longest_streak, last_login_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? { current_streak: 0, longest_streak: 0, last_login_date: null };
}

module.exports = { recordLogin, getStreak, STREAK_MILESTONES };