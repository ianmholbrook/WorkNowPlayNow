class Task {
  constructor(id, created_at, name, category, description, completed = false) {
    this.id = id;
    this.created_at = created_at;
    this.name = name;
    this.category = category;
    this.description = description;
    this.completed = completed;
  }
}

let categories = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
  { id: 3, name: 'Health' },
  { id: 4, name: 'Other' },
];

module.exports = { Task, categories };
