const express = require('express');
const router = express.Router();
const { getTotalPoints, getPointsHistory } = require('../lib/points');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// GET /points - get the signed-in user's total points and history
router.get('/', async (req, res, next) => {
  try {
    const [total, history] = await Promise.all([
      getTotalPoints(req.user.id, req.token),
      getPointsHistory(req.user.id, req.token),
    ]);
    res.json({ total, history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;