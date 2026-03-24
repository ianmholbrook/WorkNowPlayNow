const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const ejs = require('ejs');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get("/", (req, res) => {
	res.render("index.ejs", {});
});

app.listen( 8080, () => {
	console.log("App launched! Go to http://localhost:8080/ to see");
});
