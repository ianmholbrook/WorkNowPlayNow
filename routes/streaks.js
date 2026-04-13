const express = require('express');
const router = express.Router();
const { recordLogin, getStreak } = require('../lib/streaks');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// POST /streaks/login
router.post('/login', async (req, res, next) => {
  try {
    const result = await recordLogin(req.user.id, req.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /streaks
router.get('/', async (req, res, next) => {
  try {
    const streak = await getStreak(req.user.id, req.token);
    res.json(streak);
  } catch (err) {
    next(err);
  }
});

module.exports = router;