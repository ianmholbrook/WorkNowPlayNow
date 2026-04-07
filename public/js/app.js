const statusNode = document.getElementById('auth-status');
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const taskNameInput = document.getElementById('task-name');
const taskCategorySelect = document.getElementById('task-category');
const taskDescriptionInput = document.getElementById('task-description');
let categoriesById = {};

function renderTasks(tasks) {
  tasksContainer.innerHTML = tasks.length
    ? tasks.map(task => `
      <div class="feature-card" data-id="${task.id}">
        <h3>${task.name}</h3>
        <p>${categoriesById[task.category]?.name ?? 'Uncategorized'}</p>
        ${task.description ? `<p>${task.description}</p>` : ''}
        <button class="complete-button" data-id="${task.id}">${task.completed ? 'Completed' : 'Complete'}</button>
      </div>
    `).join('')
    : '<div class="feature-card"><p>No tasks yet.</p></div>';
}

function populateCategoryOptions(categories) {
  categoriesById = categories.reduce((map, category) => {
    map[category.id] = category;
    return map;
  }, {});

  if (!taskCategorySelect) return;

  taskCategorySelect.innerHTML = `
    <option value="">Choose category</option>
    ${categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('')}
  `;
}

async function getSession() {
  const { data, error } = await window.supabase.auth.getSession();
  if (error) {
    statusNode.textContent = `Auth error: ${error.message}`;
    return null;
  }
  if (!data?.session) {
    window.location.href = '/';
    return null;
  }
  return data.session;
}

async function loadTasks() {
  const session = await getSession();
  if (!session) return;

  const response = await fetch('/tasks', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    statusNode.textContent = 'Unable to load tasks. Please sign in again.';
    return;
  }

  const data = await response.json();
  populateCategoryOptions(data.categories || []);
  renderTasks(data.tasks || []);
}

async function addTask(event) {
  event.preventDefault();
  const session = await getSession();
  if (!session) return;

  const name = taskNameInput?.value.trim();
  const category = taskCategorySelect?.value;
  const description = taskDescriptionInput?.value.trim() || '';

  if (!name || !category) return;

  const response = await fetch('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name, category, description }),
  });

  if (response.ok) {
    if (taskNameInput) taskNameInput.value = '';
    if (taskCategorySelect) taskCategorySelect.value = '';
    if (taskDescriptionInput) taskDescriptionInput.value = '';
    await loadTasks();
  } else {
    statusNode.textContent = 'Unable to add task. Please try again.';
  }
}

async function completeTask(taskId) {
  const session = await getSession();
  if (!session) return;

  const response = await fetch(`/tasks/${taskId}/complete`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (response.ok) {
    await loadTasks();
  }
}

tasksContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('.complete-button');
  if (!button) return;
  const taskId = button.dataset.id;
  completeTask(taskId);
});

taskForm?.addEventListener('submit', addTask);

window.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession();
  if (session) {
    statusNode.textContent = `Signed in as ${session.user.email}`;
    await loadTasks();
  }
});
