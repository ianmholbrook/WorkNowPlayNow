const express = require('express');
const router = express.Router();
const { Task, tasks, categories } = require('../models/task');

// GET /tasks - Display tasks under categories (for frontend)
router.get('/', (req, res) => {
  res.json({ tasks, categories });
});

// POST /tasks - Add task to category
router.post('/', (req, res) => {
  const { title, category } = req.body;
  const newTask = new Task(Date.now(), title, category);
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /tasks/:id/complete - Mark task as complete
router.put('/:id/complete', (req, res) => {
  const task = tasks.find(t => t.id == req.params.id);
  if (task) {
    task.completed = true;
    res.json(task);
  } else {
    res.status(404).send('Task not found');
  }
});

module.exports = router;