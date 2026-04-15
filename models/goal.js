class Goal {
  constructor({ id, created_at, title, description, completed, completed_at, user_id }) {
    this.id = id;
    this.created_at = created_at;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.completed_at = completed_at ?? null;
    this.user_id = user_id;
  }

  static fromDB(row) {
    return new Goal(row);
  }

  toJSON() {
    return {
      id: this.id,
      created_at: this.created_at,
      title: this.title,
      description: this.description,
      completed: this.completed,
      completed_at: this.completed_at,
      user_id: this.user_id,
    };
  }
}

module.exports = { Goal };