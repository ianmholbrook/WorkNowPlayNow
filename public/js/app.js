// ── Helpers ──────────────────────────────────────────────────────────────────

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function getSession() {
  const { data, error } = await window.supabase.auth.getSession();
  if (error || !data?.session) {
    window.location.href = '/';
    return null;
  }
  return data.session;
}

async function apiFetch(path, options = {}) {
  const session = await getSession();
  if (!session) return null;
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Inline SVG icon helper — keeps dynamic content consistent with Lucide style
function icon(name, size = 14) {
  const icons = {
    'play':          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    'check':         `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    'x':             `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    'clock':         `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'tag':           `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    'target':        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    'clipboard':     `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
  };
  return icons[name] ?? '';
}

// ── State ─────────────────────────────────────────────────────────────────────

let allTasks      = [];
let allGoals      = [];
let allCategories = [];
let currentFilter = 'all';

// ── Render Tasks ──────────────────────────────────────────────────────────────

function getCategoryName(id) {
  return allCategories.find(c => c.id === id)?.name ?? null;
}

function getGoalTitle(id) {
  return allGoals.find(g => g.id === id)?.title ?? null;
}

function renderTasks() {
  const container = document.getElementById('tasks-container');
  const filtered = currentFilter === 'all'
    ? allTasks
    : allTasks.filter(t => t.status === currentFilter);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">${icon('clipboard', 40)}</div>
        <h3>No tasks here</h3>
        <p>${currentFilter === 'all' ? 'Add your first task to get started.' : `No ${currentFilter.replace('_', ' ')} tasks.`}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(task => `
    <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="task-status ${task.status}">${task.status.replace('_', ' ')}</span>
        ${getCategoryName(task.category_id) ? `
          <span class="task-category">
            ${icon('tag', 11)} ${escapeHtml(getCategoryName(task.category_id))}
          </span>` : ''}
        ${getGoalTitle(task.goal_id) ? `
          <span class="task-category" style="background:rgba(255,107,53,0.1);color:var(--orange);border-color:rgba(255,107,53,0.25);">
            ${icon('target', 11)} ${escapeHtml(getGoalTitle(task.goal_id))}
          </span>` : ''}
      </div>
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      ${task.due_date ? `
        <div class="task-description" style="color:#ffc800;display:flex;align-items:center;gap:5px;">
          ${icon('clock', 13)} Due ${new Date(task.due_date).toLocaleDateString()}
        </div>` : ''}
      <div class="task-actions">
        ${task.status !== 'completed' ? `
          ${task.status === 'pending' ? `
            <button class="complete-button" data-action="progress" data-id="${task.id}">
              ${icon('play', 13)} Start
            </button>` : ''}
          ${task.status === 'in_progress' ? `
            <button class="complete-button" data-action="complete" data-id="${task.id}">
              ${icon('check', 13)} Complete
            </button>` : ''}
        ` : `<button class="complete-button" disabled>${icon('check', 13)} Done</button>`}
        <button class="btn btn-danger" style="padding:8px 12px;font-size:13px;" data-action="delete" data-id="${task.id}">
          ${icon('x', 13)}
        </button>
      </div>
    </div>
  `).join('');
}

// ── Render Goals ──────────────────────────────────────────────────────────────

function renderGoals() {
  const container = document.getElementById('goals-container');
  if (!allGoals.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">${icon('target', 40)}</div>
        <h3>No goals yet</h3>
        <p>Set your first goal to start tracking progress.</p>
      </div>`;
    return;
  }

  container.innerHTML = allGoals.map(goal => {
    const pct = goal.progress?.percent_complete ?? 0;
    return `
    <div class="goal-card" data-id="${goal.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div class="task-title">${escapeHtml(goal.title)}</div>
        ${goal.completed ? '<span class="task-status completed">Complete</span>' : ''}
      </div>
      ${goal.description ? `<div class="task-description" style="color:rgba(255,255,255,0.4);">${escapeHtml(goal.description)}</div>` : ''}
      <div style="margin-top:4px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">
          <span>Progress</span><span>${pct}%</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      ${!goal.completed ? `
      <div class="task-actions" style="margin-top:8px;">
        <input type="number" min="0" max="100" value="${pct}"
          placeholder="%" style="width:80px;padding:6px 10px;font-size:13px;"
          class="goal-progress-input" data-id="${goal.id}">
        <button class="complete-button" data-action="update-progress" data-id="${goal.id}">Update</button>
        <button class="btn btn-danger" style="padding:8px 12px;font-size:13px;" data-action="delete-goal" data-id="${goal.id}">
          ${icon('x', 13)}
        </button>
      </div>` : `
      <div class="task-actions" style="margin-top:8px;">
        <button class="btn btn-danger" style="padding:8px 12px;font-size:13px;" data-action="delete-goal" data-id="${goal.id}">
          ${icon('x', 13)}
        </button>
      </div>`}
    </div>`;
  }).join('');
}

// ── Load Data ─────────────────────────────────────────────────────────────────

async function loadCategories() {
  try {
    const data = await apiFetch('/categories');
    if (!data) return;
    allCategories = data.categories ?? [];
    populateCategorySelect();
  } catch (err) {
    console.error('Failed to load categories:', err.message);
  }
}

async function loadTasks() {
  try {
    const data = await apiFetch('/tasks');
    if (!data) return;
    allTasks = data.tasks ?? [];
    renderTasks();
    updateTasksStat();
  } catch (err) {
    toast('Failed to load tasks', 'error');
  }
}

async function loadGoals() {
  try {
    const data = await apiFetch('/goals');
    if (!data) return;
    allGoals = data.goals ?? [];
    populateGoalSelect();
    renderGoals();
  } catch (err) {
    toast('Failed to load goals', 'error');
  }
}

async function loadStats() {
  try {
    const streak = await apiFetch('/streaks/login', { method: 'POST' });
    if (streak) {
      document.getElementById('sidebar-streak').textContent = streak.current_streak;
      document.getElementById('sidebar-streak-sub').textContent =
        `day${streak.current_streak !== 1 ? 's' : ''} in a row`;
      document.getElementById('header-streak').innerHTML =
        `<i data-lucide="flame" style="width:14px;height:14px;"></i> ${streak.current_streak} day streak`;
      if (streak.milestoneReached) {
        toast(`${streak.milestoneReached}-day streak milestone! +${streak.pointsAwarded?.points ?? 0} bonus pts`, 'success');
      }
      lucide.createIcons();
    }
    const pts = await apiFetch('/points');
    if (pts) {
      document.getElementById('sidebar-points').textContent = pts.total;
      document.getElementById('header-points').innerHTML =
        `<i data-lucide="star" style="width:14px;height:14px;"></i> ${pts.total} pts`;
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Stats load failed:', err.message);
  }
}

function updateTasksStat() {
  const done = allTasks.filter(t => t.status === 'completed').length;
  document.getElementById('sidebar-tasks-done').textContent = done;
}

// ── Populate Selects ──────────────────────────────────────────────────────────

function populateCategorySelect() {
  const sel = document.getElementById('task-category');
  if (!sel) return;
  sel.innerHTML = `<option value="">No category</option>` +
    allCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}${c.is_default ? '' : ' ★'}</option>`).join('');
}

function populateGoalSelect() {
  const sel = document.getElementById('task-goal');
  if (!sel) return;
  sel.innerHTML = `<option value="">No goal</option>` +
    allGoals.filter(g => !g.completed)
      .map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`).join('');
}

// ── Task Actions ──────────────────────────────────────────────────────────────

async function addTask(e) {
  e.preventDefault();
  const title       = document.getElementById('task-title')?.value.trim();
  const category_id = document.getElementById('task-category')?.value || null;
  const goal_id     = document.getElementById('task-goal')?.value || null;
  const description = document.getElementById('task-description')?.value.trim() || '';
  const due_date    = document.getElementById('task-due-date')?.value || null;
  if (!title) return;
  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, category_id, goal_id, description, due_date }),
    });
    document.getElementById('task-form').reset();
    document.getElementById('task-form-wrapper').style.display = 'none';
    toast('Task added! Complete it to earn points', 'success');
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function updateTaskStatus(taskId, status) {
  try {
    const data = await apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (status === 'completed' && data?.pointsAwarded) {
      toast(`Task complete! +${data.pointsAwarded.points} pts (Total: ${data.pointsAwarded.total})`, 'success');
      document.getElementById('sidebar-points').textContent = data.pointsAwarded.total;
      document.getElementById('header-points').innerHTML =
        `<i data-lucide="star" style="width:14px;height:14px;"></i> ${data.pointsAwarded.total} pts`;
      lucide.createIcons();
    } else {
      toast('Task updated', 'info');
    }
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteTask(taskId) {
  try {
    await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    toast('Task deleted', 'info');
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Goal Actions ──────────────────────────────────────────────────────────────

async function addGoal(e) {
  e.preventDefault();
  const title       = document.getElementById('goal-title')?.value.trim();
  const description = document.getElementById('goal-description')?.value.trim() || '';
  if (!title) return;
  try {
    await apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
    document.getElementById('goal-form').reset();
    document.getElementById('goal-form-wrapper').style.display = 'none';
    toast('Goal created!', 'success');
    await loadGoals();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function updateGoalProgress(goalId, percent) {
  try {
    const data = await apiFetch(`/goals/${goalId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ percent_complete: percent }),
    });
    if (data?.pointsAwarded) {
      toast(`Goal complete! +${data.pointsAwarded.points} pts`, 'success');
      document.getElementById('sidebar-points').textContent = data.pointsAwarded.total;
      document.getElementById('header-points').innerHTML =
        `<i data-lucide="star" style="width:14px;height:14px;"></i> ${data.pointsAwarded.total} pts`;
      lucide.createIcons();
    } else {
      toast(`Progress updated to ${percent}%`, 'info');
    }
    await loadGoals();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteGoal(goalId) {
  try {
    await apiFetch(`/goals/${goalId}`, { method: 'DELETE' });
    toast('Goal deleted', 'info');
    await loadGoals();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Event Delegation ──────────────────────────────────────────────────────────

document.getElementById('tasks-container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'complete') updateTaskStatus(id, 'completed');
  if (action === 'progress') updateTaskStatus(id, 'in_progress');
  if (action === 'delete')   deleteTask(id);
});

document.getElementById('goals-container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'delete-goal') deleteGoal(id);
  if (action === 'update-progress') {
    const input = document.querySelector(`.goal-progress-input[data-id="${id}"]`);
    const val   = Number(input?.value);
    if (!isNaN(val)) updateGoalProgress(id, val);
  }
});

// ── Sidebar Nav ───────────────────────────────────────────────────────────────

document.querySelectorAll('.sidebar-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('view-tasks').style.display = view === 'tasks' ? '' : 'none';
    document.getElementById('view-goals').style.display = view === 'goals' ? '' : 'none';
    if (view === 'goals') loadGoals();
  });
});

// ── Filter Buttons ────────────────────────────────────────────────────────────

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ── Toggle Forms ──────────────────────────────────────────────────────────────

document.getElementById('toggle-task-form')?.addEventListener('click', () => {
  const wrapper = document.getElementById('task-form-wrapper');
  wrapper.style.display = wrapper.style.display === 'none' ? '' : 'none';
});
document.getElementById('cancel-task-form')?.addEventListener('click', () => {
  document.getElementById('task-form-wrapper').style.display = 'none';
  document.getElementById('task-form').reset();
});
document.getElementById('toggle-goal-form')?.addEventListener('click', () => {
  const wrapper = document.getElementById('goal-form-wrapper');
  wrapper.style.display = wrapper.style.display === 'none' ? '' : 'none';
});
document.getElementById('cancel-goal-form')?.addEventListener('click', () => {
  document.getElementById('goal-form-wrapper').style.display = 'none';
  document.getElementById('goal-form').reset();
});

// ── Form Submissions ──────────────────────────────────────────────────────────

document.getElementById('task-form')?.addEventListener('submit', addTask);
document.getElementById('goal-form')?.addEventListener('submit', addGoal);

// ── Utils ─────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession();
  if (!session) return;

  const authStatus = document.getElementById('auth-status');
  if (authStatus) authStatus.textContent = session.user.email;

  await Promise.all([loadCategories(), loadTasks(), loadGoals(), loadStats()]);
});