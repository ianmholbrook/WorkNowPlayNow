const { getAuthClient } = require('./supabase');

const POINTS = {
  task: 10,
  goal: 50,
  streak: 0, //streak milestones define their own point values
};

async function awardPoints(userId, sourceType, sourceId, token, customPoints = null) {
  const db = getAuthClient(token);
  const points = customPoints ?? POINTS[sourceType];
  if (points === undefined || points === null) throw new Error(`Unknown source type: ${sourceType}`);
  const { error } = await db
    .from('user_points')
    .insert([{ user_id: userId, source_type: sourceType, source_id: sourceId, points }]);

  if (error) throw error;

  const total = await getTotalPoints(userId, token);
  return { points, total };
}

async function getTotalPoints(userId, token) {
  const db = getAuthClient(token);
  const { data, error } = await db
    .from('user_points')
    .select('points')
    .eq('user_id', userId);

  if (error) throw error;
  return data.reduce((sum, row) => sum + row.points, 0);
}

async function getPointsHistory(userId, token) {
  const db = getAuthClient(token);
  const { data, error } = await db
    .from('user_points')
    .select('id, source_type, source_id, points, awarded_at')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = { awardPoints, getTotalPoints, getPointsHistory, POINTS };