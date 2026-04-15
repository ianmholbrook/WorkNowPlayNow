require('dotenv').config({ path: '.env.local' });

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.host}${req.url}`);
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/auth',         require('./routes/auth'));
app.use('/tasks',        require('./routes/tasks'));
app.use('/goals',        require('./routes/goals'));
app.use('/points',       require('./routes/points'));
app.use('/streaks',      require('./routes/streaks'));
app.use('/categories',   require('./routes/categories'));
app.use('/achievements', require('./routes/achievements'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Global error:', JSON.stringify(err, null, 2));
  console.error('Stack:', err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`App launched! Go to http://localhost:${process.env.PORT || 8080}/ to see`);
});