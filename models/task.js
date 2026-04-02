class Task {
  constructor(id, title, category, description, completed = false) {
    this.id = id;
    this.title = title;
    this.category = category;
    this.description = description;
    this.completed = completed;
  }
}

// In-memory storage right now (replace with SQLDB later)
let tasks = [];
let categories = ['Work', 'Personal', 'Health', '...']; 

module.exports = { Task, tasks, categories };
