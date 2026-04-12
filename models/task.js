class Task {
  // Ian - Fixed to be representative of the actual "tasks" table in supabase
  constructor({ id, created_at, title, description, status, category, goal_id, due_date, reminder_time, reminder_sent, user_id }) {
    this.id = id;
    this.created_at = created_at;
    this.title = title;
    this.description = description;
    this.status = status;          // 'pending' | 'in_progress' | 'completed' etc.
    this.category = category;
    this.goal_id = goal_id;
    this.due_date = due_date;
    this.reminder_time = reminder_time;
    this.reminder_sent = reminder_sent;
    this.user_id = user_id;
  }

  // Creates a Task instance from a raw Supabase row
  static fromDB(row) {
    return new Task(row);
  }

  // Returns a plain object suitable for sending as a JSON response
  toJSON() {
    return {
      id: this.id,
      created_at: this.created_at,
      title: this.title,
      description: this.description,
      status: this.status,
      category: this.category,
      goal_id: this.goal_id,
      due_date: this.due_date,
      reminder_time: this.reminder_time,
      reminder_sent: this.reminder_sent,
      user_id: this.user_id,
    };
  }
}

// WIP - Ian
// TODO: Replace with a DB lookup from the categories table once it is ready
const categories = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
  { id: 3, name: 'Health' },
  { id: 4, name: 'Other' },
];

module.exports = { Task, categories };