const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const ejs = require('ejs');

const db = require("./lib/supabase.js");

app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/tasks', require('./routes/tasks')); //tasks router

app.get("/", (req, res) => {
	res.redirect("/index.html");
});

app.listen( process.env.PORT || 8080, () => {
	console.log(`App launched! Go to http://localhost:${process.env.PORT || 8080}/ to see`);
});
