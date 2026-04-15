class Task {
  constructor({ id, created_at, title, description, status, category_id, goal_id, due_date, reminder_time, reminder_sent, user_id }) {
    this.id = id;
    this.created_at = created_at;
    this.title = title;
    this.description = description;
    this.status = status;
    this.category_id = category_id;
    this.goal_id = goal_id;
    this.due_date = due_date;
    this.reminder_time = reminder_time;
    this.reminder_sent = reminder_sent;
    this.user_id = user_id;
  }

  static fromDB(row) {
    return new Task(row);
  }

  toJSON() {
    return {
      id: this.id,
      created_at: this.created_at,
      title: this.title,
      description: this.description,
      status: this.status,
      category_id: this.category_id,
      goal_id: this.goal_id,
      due_date: this.due_date,
      reminder_time: this.reminder_time,
      reminder_sent: this.reminder_sent,
      user_id: this.user_id,
    };
  }
}

module.exports = { Task };