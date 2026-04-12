class Goal {
  constructor({ id, created_at, title, description, completed, user_id }) {
    this.id = id;
    this.created_at = created_at;
    this.title = title;
    this.description = description;
    this.completed = completed;
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
      user_id: this.user_id,
    };
  }
}

class GoalProgress {
  constructor({ id, goal_id, percent_complete, updated_at }) {
    this.id = id;
    this.goal_id = goal_id;
    this.percent_complete = percent_complete;
    this.updated_at = updated_at;
  }

  static fromDB(row) {
    return new GoalProgress(row);
  }

  toJSON() {
    return {
      id: this.id,
      goal_id: this.goal_id,
      percent_complete: this.percent_complete,
      updated_at: this.updated_at,
    };
  }
}

module.exports = { Goal, GoalProgress };