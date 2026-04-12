require('dotenv').config({ path: '.env.local' });

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

const db = require("./lib/supabase.js");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));
app.use('/goals', require('./routes/goals'));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`App launched! Go to http://localhost:${process.env.PORT || 8080}/ to see`);
});