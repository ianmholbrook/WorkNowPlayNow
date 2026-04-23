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
  if (!window.supabase) { window.location.replace('/index.html'); return null; }
  const { data, error } = await window.supabase.auth.getSession();
  if (error || !data?.session) { window.location.replace('/index.html'); return null; }
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

function icon(name, size = 14) {
  const icons = {
    'play':      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    'check':     `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    'x':         `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    'clock':     `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'tag':       `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    'target':    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    'clipboard': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    'trophy':    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4a1 1 0 0 0-1 1v3a4 4 0 0 0 4 4h1"/><path d="M17 4h3a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4h-1"/><rect x="7" y="2" width="10" height="9" rx="1"/></svg>`,
    'lock':      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    'calendar':  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  };
  return icons[name] ?? '';
}

// ── State ─────────────────────────────────────────────────────────────────────

let allTasks            = [];
let allGoals            = [];
let allCategories       = [];
let allAchievements     = [];
let achievementProgress = {};
let currentFilter       = 'all';

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER = {
  bronze:   { label: 'Bronze',   color: '#cd7f32', glow: 'rgba(205,127,50,0.15)',  border: 'rgba(205,127,50,0.3)'  },
  silver:   { label: 'Silver',   color: '#a8a9ad', glow: 'rgba(168,169,173,0.15)', border: 'rgba(168,169,173,0.3)' },
  gold:     { label: 'Gold',     color: '#ffd700', glow: 'rgba(255,215,0,0.15)',   border: 'rgba(255,215,0,0.3)'   },
  platinum: { label: 'Platinum', color: '#e5e4e2', glow: 'rgba(229,228,226,0.15)', border: 'rgba(229,228,226,0.3)' },
};

// ── Achievement progress mapping ──────────────────────────────────────────────

function getAchievementProgress(key, progress) {
  const p = progress || achievementProgress;
  if (key.startsWith('streak_')) { const r = parseInt(key.split('_')[1]); return { current: Math.min(p.streak ?? 0, r), required: r }; }
  if (key.startsWith('tasks_'))  { const r = parseInt(key.split('_')[1]); return { current: Math.min(p.tasks ?? 0, r),  required: r }; }
  if (key.startsWith('goals_'))  { const r = parseInt(key.split('_')[1]); return { current: Math.min(p.goals ?? 0, r),  required: r }; }
  if (key.startsWith('points_')) { const r = parseInt(key.split('_')[1]); return { current: Math.min(p.points ?? 0, r), required: r }; }
  if (key.startsWith('daily_'))  { const r = parseInt(key.split('_')[1]); return { current: Math.min(p.tasksToday ?? 0, r), required: r }; }
  if (key === 'speed_1hour') return { current: Math.min(p.quickTasks ?? 0, 1),  required: 1  };
  if (key === 'speed_10')    return { current: Math.min(p.quickTasks ?? 0, 10), required: 10 };
  return null;
}

// ── Goal Progress (derived) ───────────────────────────────────────────────────

function getGoalProgress(goalId) {
  const goalTasks = allTasks.filter(t => t.goal_id === goalId);
  if (!goalTasks.length) return { total: 0, completed: 0, pct: 0 };
  const completed = goalTasks.filter(t => t.status === 'completed').length;
  return { total: goalTasks.length, completed, pct: Math.round((completed / goalTasks.length) * 100) };
}

// ── Render Tasks ──────────────────────────────────────────────────────────────

function getCategoryName(id) { return allCategories.find(c => c.id === id)?.name ?? null; }
function getGoalTitle(id)    { return allGoals.find(g => g.id === id)?.title ?? null; }

function renderTasks() {
  const container = document.getElementById('tasks-container');
  const filtered = currentFilter === 'all' ? allTasks : allTasks.filter(t => t.status === currentFilter);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">${icon('clipboard', 40)}</div>
        <h3>No tasks here</h3>
        <p>${currentFilter === 'all' ? 'Add your first task to get started.' : `No ${currentFilter.replace('_', ' ')} tasks.`}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const onCalendar = Boolean(task.calendar_event_id);
    return `
    <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="task-status ${task.status}">${task.status.replace('_', ' ')}</span>
        ${getCategoryName(task.category_id) ? `<span class="task-category">${icon('tag', 11)} ${escapeHtml(getCategoryName(task.category_id))}</span>` : ''}
        ${getGoalTitle(task.goal_id) ? `<span class="task-category" style="background:rgba(255,107,53,0.1);color:var(--orange);border-color:rgba(255,107,53,0.25);">${icon('target', 11)} ${escapeHtml(getGoalTitle(task.goal_id))}</span>` : ''}
      </div>
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      ${task.due_date ? `
        <div class="task-description" style="color:#ffc800;display:flex;align-items:center;gap:5px;">
          ${icon('clock', 13)} Due ${new Date(task.due_date).toLocaleDateString()}
        </div>` : ''}
        ${task.subtasks?.length ? `
          <div style="margin-top:10px; padding-left:10px; border-left:2px solid rgba(255,255,255,0.1);">
          ${task.subtasks.map(st => `
            <div style="font-size:13px; opacity:0.8; margin:2px 0;">
            ${st.completed ? '✔' : '⬜'} ${escapeHtml(st.title)}
            </div>
            `).join('')}
            </div>
            ` : ''}
      <div class="task-actions">
        ${task.status !== 'completed' ? `
          ${task.status === 'pending' ? `<button class="complete-button" data-action="progress" data-id="${task.id}">${icon('play', 13)} Start</button>` : ''}
          ${task.status === 'in_progress' ? `<button class="complete-button" data-action="complete" data-id="${task.id}">${icon('check', 13)} Complete</button>` : ''}
        ` : `<button class="complete-button" disabled>${icon('check', 13)} Done</button>`}
        <button class="btn btn-secondary" style="padding:8px 12px;font-size:13px;${onCalendar ? 'color:var(--orange);border-color:rgba(255,107,53,0.3);' : ''}"
          data-action="calendar" data-id="${task.id}" ${onCalendar ? 'disabled title="Already on your calendar"' : 'title="Add to Google Calendar"'}>
          ${icon('calendar', 13)} ${onCalendar ? 'Added' : 'Schedule'}
        </button>
        <button class="btn btn-danger" style="padding:8px 12px;font-size:13px;" data-action="delete" data-id="${task.id}">${icon('x', 13)}</button>
      </div>
    </div>`;
  }).join('');
}

// ── Render Goals ──────────────────────────────────────────────────────────────

function renderGoals() {
  const container = document.getElementById('goals-container');
  if (!allGoals.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon('target', 40)}</div><h3>No goals yet</h3><p>Set your first goal to start tracking progress.</p></div>`;
    return;
  }
  container.innerHTML = allGoals.map(goal => {
    const { total, completed, pct } = getGoalProgress(goal.id);
    const goalTasks = allTasks.filter(t => t.goal_id === goal.id);
    return `
    <div class="goal-card" data-id="${goal.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div class="task-title">${escapeHtml(goal.title)}</div>
        ${goal.completed ? '<span class="task-status completed">Complete</span>' : ''}
      </div>
      ${goal.description ? `<div class="task-description" style="color:rgba(255,255,255,0.4);">${escapeHtml(goal.description)}</div>` : ''}
      <div style="margin-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">
          <span>${completed} of ${total} tasks complete</span><span>${pct}%</span>
        </div>
        <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
      </div>
      ${goalTasks.length ? `
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:4px;">
        ${goalTasks.map(t => `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${t.status === 'completed' ? 'rgba(0,200,100,0.8)' : 'rgba(255,255,255,0.4)'};">
            <span style="flex-shrink:0;">${t.status === 'completed' ? icon('check', 12) : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}</span>
            <span style="${t.status === 'completed' ? 'text-decoration:line-through;' : ''}">${escapeHtml(t.title)}</span>
          </div>`).join('')}
      </div>` : ''}
      <div class="task-actions" style="margin-top:12px;">
        <button class="btn btn-danger" style="padding:8px 12px;font-size:13px;margin-left:auto;" data-action="delete-goal" data-id="${goal.id}">${icon('x', 13)}</button>
      </div>
    </div>`;
  }).join('');
}

// ── Render Achievements ───────────────────────────────────────────────────────

function renderAchievements() {
  const container = document.getElementById('achievements-container');
  if (!container) return;
  if (!allAchievements.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon('trophy', 40)}</div><h3>No achievements found</h3><p>Complete tasks and goals to start unlocking achievements.</p></div>`;
    return;
  }
  const unlocked = allAchievements.filter(a => a.unlocked).length;
  const total    = allAchievements.length;
  const categories = [
    { key: 'streak', label: 'Streak' }, { key: 'tasks', label: 'Tasks' },
    { key: 'goals',  label: 'Goals'  }, { key: 'points', label: 'Points' },
    { key: 'daily',  label: 'Daily Hustle' }, { key: 'speed', label: 'Speed' },
  ];
  container.innerHTML = `
    <div style="grid-column:1/-1;display:flex;align-items:center;gap:16px;margin-bottom:4px;flex-wrap:wrap;">
      <span style="font-size:13px;color:rgba(255,255,255,0.4);">${unlocked} of ${total} unlocked</span>
      <div style="flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:99px;min-width:120px;">
        <div style="height:100%;width:${Math.round((unlocked/total)*100)}%;background:linear-gradient(90deg,var(--blue),var(--orange));border-radius:99px;transition:width 600ms ease;"></div>
      </div>
    </div>
    ${categories.map(cat => {
      const items = allAchievements.filter(a => a.category === cat.key);
      if (!items.length) return '';
      return `
        <div style="grid-column:1/-1;margin-top:8px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.2);margin-bottom:12px;">${cat.label}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
            ${items.map(a => renderAchievementCard(a)).join('')}
          </div>
        </div>`;
    }).join('')}`;
}

function renderAchievementCard(a) {
  const tier   = TIER[a.tier] ?? TIER.bronze;
  const locked = !a.unlocked;
  const prog   = locked ? getAchievementProgress(a.key, achievementProgress) : null;
  const pct    = prog ? Math.round((prog.current / prog.required) * 100) : 0;
  return `
    <div style="background:${locked ? 'rgba(0,0,0,0.2)' : tier.glow};border:1px solid ${locked ? 'rgba(255,255,255,0.06)' : tier.border};border-radius:var(--radius);padding:16px;display:flex;flex-direction:column;gap:10px;transition:var(--transition);">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="width:40px;height:40px;flex-shrink:0;border-radius:var(--radius-sm);background:${locked ? 'rgba(255,255,255,0.04)' : tier.glow};border:1px solid ${locked ? 'rgba(255,255,255,0.08)' : tier.border};display:flex;align-items:center;justify-content:center;color:${locked ? 'rgba(255,255,255,0.15)' : tier.color};">
          ${locked ? icon('lock', 16) : `<i data-lucide="${a.icon}" style="width:18px;height:18px;stroke:${tier.color};"></i>`}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
            <span style="font-size:14px;font-weight:600;color:${locked ? 'rgba(255,255,255,0.3)' : '#f0f0f5'};">${escapeHtml(a.title)}</span>
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:1px 7px;border-radius:99px;color:${locked ? 'rgba(255,255,255,0.2)' : tier.color};background:${locked ? 'rgba(255,255,255,0.04)' : tier.glow};border:1px solid ${locked ? 'rgba(255,255,255,0.08)' : tier.border};">${tier.label}</span>
          </div>
          <div style="font-size:12px;color:${locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'};margin-bottom:4px;">${escapeHtml(a.description)}</div>
          <div style="font-size:12px;color:${locked ? 'rgba(255,255,255,0.15)' : 'var(--orange)'};">
            ${icon('trophy', 11)} +${a.points} pts
            ${a.unlocked && a.unlocked_at ? `<span style="color:rgba(255,255,255,0.2);margin-left:8px;">Unlocked ${new Date(a.unlocked_at).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
      </div>
      ${locked && prog ? `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.2);margin-bottom:5px;"><span>Progress</span><span>${prog.current.toLocaleString()} / ${prog.required.toLocaleString()}</span></div>
          <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${tier.color};border-radius:99px;opacity:0.5;transition:width 600ms ease;"></div>
          </div>
        </div>` : ''}
    </div>`;
}

// ── Render Reports ────────────────────────────────────────────────────────────

function renderReports() {
  const container = document.getElementById('reports-container');
  if (!container) return;

  const now   = new Date();

  // Weekly boundaries
  const weekStart     = new Date(now); weekStart.setDate(now.getDate() - 7);
  const prevWeekStart = new Date(now); prevWeekStart.setDate(now.getDate() - 14);
  const prevWeekEnd   = weekStart;

  // Monthly boundaries
  const monthStart     = new Date(now); monthStart.setDate(now.getDate() - 30);
  const prevMonthStart = new Date(now); prevMonthStart.setDate(now.getDate() - 60);
  const prevMonthEnd   = monthStart;

  // ── Count helpers ──
  function countTasksIn(from, to) {
    return allTasks.filter(t => {
      if (t.status !== 'completed') return false;
      const d = new Date(t.updated_at ?? t.created_at);
      return d >= from && d < to;
    }).length;
  }

  function countGoalsIn(from, to) {
    return allGoals.filter(g => {
      if (!g.completed || !g.completed_at) return false;
      const d = new Date(g.completed_at);
      return d >= from && d < to;
    }).length;
  }

  function countAchievementsIn(from, to) {
    return allAchievements.filter(a => {
      if (!a.unlocked || !a.unlocked_at) return false;
      const d = new Date(a.unlocked_at);
      return d >= from && d < to;
    }).length;
  }

  // ── This period counts ──
  const weekTasks        = countTasksIn(weekStart, now);
  const weekGoals        = countGoalsIn(weekStart, now);
  const weekAchievements = countAchievementsIn(weekStart, now);

  const monthTasks        = countTasksIn(monthStart, now);
  const monthGoals        = countGoalsIn(monthStart, now);
  const monthAchievements = countAchievementsIn(monthStart, now);

  // ── Previous period counts ──
  const prevWeekTasks        = countTasksIn(prevWeekStart, prevWeekEnd);
  const prevWeekGoals        = countGoalsIn(prevWeekStart, prevWeekEnd);
  const prevWeekAchievements = countAchievementsIn(prevWeekStart, prevWeekEnd);

  const prevMonthTasks        = countTasksIn(prevMonthStart, prevMonthEnd);
  const prevMonthGoals        = countGoalsIn(prevMonthStart, prevMonthEnd);
  const prevMonthAchievements = countAchievementsIn(prevMonthStart, prevMonthEnd);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
      ${reportCard('Weekly Summary', 'Past 7 days', [
        { label: 'Tasks Completed',      current: weekTasks,        prev: prevWeekTasks,        period: 'last week' },
        { label: 'Goals Completed',      current: weekGoals,        prev: prevWeekGoals,        period: 'last week' },
        { label: 'Achievements Unlocked',current: weekAchievements, prev: prevWeekAchievements, period: 'last week' },
      ])}
      ${reportCard('Monthly Summary', 'Past 30 days', [
        { label: 'Tasks Completed',      current: monthTasks,        prev: prevMonthTasks,        period: 'last month' },
        { label: 'Goals Completed',      current: monthGoals,        prev: prevMonthGoals,        period: 'last month' },
        { label: 'Achievements Unlocked',current: monthAchievements, prev: prevMonthAchievements, period: 'last month' },
      ])}
    </div>`;
}

function reportCard(title, subtitle, stats) {
  return `
    <div style="background:var(--bg-dark-card);border:1px solid rgba(255,255,255,0.06);border-radius:var(--radius);padding:24px;display:flex;flex-direction:column;gap:20px;">
      <div>
        <h3 style="color:#f0f0f5;margin-bottom:4px;">${title}</h3>
        <div style="font-size:12px;color:rgba(255,255,255,0.3);">${subtitle}</div>
      </div>
      ${stats.map(s => reportStat(s)).join('')}
    </div>`;
}

function reportStat({ label, current, prev, period }) {
  const diff    = current - prev;
  const isUp    = diff > 0;
  const isDown  = diff < 0;
  const isSame  = diff === 0;

  const diffColor  = isUp ? '#00c864' : isDown ? '#e05555' : 'rgba(255,255,255,0.3)';
  const diffPrefix = isUp ? '+' : '';
  const diffLabel  = isSame
    ? `Same as ${period}`
    : `${diffPrefix}${diff} vs ${period}`;

  // Progress bar: current as fraction of max(current, prev) or 1
  const max = Math.max(current, prev, 1);
  const pct = Math.round((current / max) * 100);

  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:13px;color:rgba(255,255,255,0.5);">${label}</span>
        <span style="font-size:28px;font-weight:700;font-family:'Syne',sans-serif;color:var(--orange);">${current}</span>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--blue-bright),var(--orange));border-radius:99px;transition:width 600ms ease;"></div>
      </div>
      <div style="font-size:12px;color:${diffColor};">${diffLabel}</div>
    </div>`;
}

// ── Achievement toast ─────────────────────────────────────────────────────────

function toastAchievements(newAchievements) {
  if (!newAchievements?.length) return;
  newAchievements.forEach(({ achievement, pointsAwarded }) => {
    const tier = TIER[achievement.tier] ?? TIER.bronze;
    toast(`🏆 Achievement unlocked: "${achievement.title}" (${tier.label}) +${pointsAwarded?.points ?? achievement.points} pts`, 'success');
  });
  loadAchievementCount();
}

// ── Render Goal Task Picker ───────────────────────────────────────────────────

function renderGoalTaskPicker() {
  const container = document.getElementById('goal-task-picker');
  if (!container) return;
  const available = allTasks.filter(t => !t.goal_id && t.status !== 'completed');
  if (!available.length) {
    container.innerHTML = `<p style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;">No unassigned tasks available. Create some tasks first.</p>`;
    return;
  }
  container.innerHTML = available.map(t => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:var(--transition);font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:6px;">
      <input type="checkbox" name="goal-tasks" value="${t.id}" style="width:auto;accent-color:var(--orange);" onchange="updateGoalTaskCount()">
      <span>${escapeHtml(t.title)}</span>
      ${getCategoryName(t.category_id) ? `<span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.3);">${escapeHtml(getCategoryName(t.category_id))}</span>` : ''}
    </label>`).join('');
}

function updateGoalTaskCount() {
  const checked   = document.querySelectorAll('input[name="goal-tasks"]:checked').length;
  const counter   = document.getElementById('goal-task-count');
  const submitBtn = document.getElementById('goal-submit-btn');
  if (counter) { counter.textContent = `${checked} selected`; counter.style.color = checked >= 3 ? 'var(--orange)' : 'rgba(255,255,255,0.3)'; }
  if (submitBtn) { submitBtn.disabled = checked < 3; submitBtn.title = checked < 3 ? 'Select at least 3 tasks' : ''; }
}
window.updateGoalTaskCount = updateGoalTaskCount;

// ── Load Data ─────────────────────────────────────────────────────────────────

async function loadCategories() {
  try {
    const data = await apiFetch('/categories');
    if (!data) return;
    allCategories = data.categories ?? [];
    populateCategorySelect();
  } catch (err) { console.error('Failed to load categories:', err.message); }
}

async function loadTasks() {
  try {
    const data = await apiFetch('/tasks');
    if (!data) return;
    allTasks = data.tasks ?? [];
    renderTasks();
    updateTasksStat();
  } catch (err) { toast('Failed to load tasks', 'error'); }
}

async function loadGoals() {
  try {
    const data = await apiFetch('/goals');
    if (!data) return;
    allGoals = data.goals ?? [];
    populateGoalSelect();
    renderGoals();
  } catch (err) { toast('Failed to load goals', 'error'); }
}

async function loadAchievements() {
  try {
    const data = await apiFetch('/achievements');
    if (!data) return;
    allAchievements     = data.achievements ?? [];
    achievementProgress = data.progress ?? {};
    renderAchievements();
    lucide.createIcons();
  } catch (err) { toast('Failed to load achievements', 'error'); }
}

async function loadAchievementCount() {
  try {
    const data = await apiFetch('/achievements/count');
    if (!data) return;
    const el = document.getElementById('sidebar-achievements');
    if (el) el.textContent = data.count;
  } catch (err) { console.error('Failed to load achievement count:', err.message); }
}

async function loadStats() {
  try {
    const session = await getSession();
    if (!session?.access_token) return;

    const streak = await apiFetch('/streaks/login', { method: 'POST' });
    if (streak) {
      document.getElementById('sidebar-streak').textContent = streak.current_streak;
      document.getElementById('sidebar-streak-sub').textContent = `day${streak.current_streak !== 1 ? 's' : ''} in a row`;
      document.getElementById('header-streak').innerHTML = `<i data-lucide="flame" style="width:14px;height:14px;"></i> ${streak.current_streak} day streak`;
      if (streak.milestoneReached) toast(`${streak.milestoneReached}-day streak milestone! +${streak.pointsAwarded?.points ?? 0} bonus pts`, 'success');
      toastAchievements(streak.newAchievements);
      lucide.createIcons();
    }

    const pts = await apiFetch('/points');
    if (pts) {
      document.getElementById('sidebar-points').textContent = pts.total;
      document.getElementById('header-points').innerHTML = `<i data-lucide="star" style="width:14px;height:14px;"></i> ${pts.total} pts`;
      lucide.createIcons();
    }

    await loadAchievementCount();
  } catch (err) { console.error('Stats load failed:', err.message); }
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
    allGoals.filter(g => !g.completed).map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`).join('');
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
    await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title, category_id, goal_id, description, due_date }) });
    document.getElementById('task-form').reset();
    document.getElementById('task-form-wrapper').style.display = 'none';
    toast('Task added! Complete it to earn points', 'success');
    await loadTasks();
    renderGoalTaskPicker();
    updateGoalTaskCount();
  } catch (err) { toast(err.message, 'error'); }
}

async function updateTaskStatus(taskId, status) {
  try {
    const data = await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (status === 'completed' && data?.pointsAwarded) {
      toast(`Task complete! +${data.pointsAwarded.points} pts (Total: ${data.pointsAwarded.total})`, 'success');
      document.getElementById('sidebar-points').textContent = data.pointsAwarded.total;
      document.getElementById('header-points').innerHTML = `<i data-lucide="star" style="width:14px;height:14px;"></i> ${data.pointsAwarded.total} pts`;
      lucide.createIcons();
    } else { toast('Task updated', 'info'); }

    toastAchievements(data?.newAchievements);

    const task = allTasks.find(t => t.id === taskId);
    if (task) task.status = status;
    if (status === 'completed' && task?.goal_id) await checkGoalCompletion(task.goal_id);

    await loadTasks();
    if (document.getElementById('view-goals').style.display !== 'none') renderGoals();
    if (document.getElementById('view-achievements').style.display !== 'none') await loadAchievements();
    if (document.getElementById('view-reports').style.display !== 'none') renderReports();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteTask(taskId) {
  try {
    await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    toast('Task deleted', 'info');
    await loadTasks();
    renderGoals();
  } catch (err) { toast(err.message, 'error'); }
}

// ── Google Calendar ───────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = '263983146208-cu7dmrc73um08jej3hl93h2lml3228bb.apps.googleusercontent.com';
const CALENDAR_SCOPE   = 'https://www.googleapis.com/auth/calendar.events';
let   _calendarToken   = null;

function getCalendarToken() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) { reject(new Error('Google Identity Services not loaded')); return; }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope:     CALENDAR_SCOPE,
      callback:  (response) => {
        if (response.error) { reject(new Error(response.error)); return; }
        _calendarToken = response.access_token;
        resolve(response.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function addTaskToCalendar(task) {
  if (!task.due_date) { toast('Add a due date to this task before scheduling it', 'error'); return; }
  try {
    toast('Connecting to Google Calendar...', 'info');
    const token = await getCalendarToken();
    const start = new Date(task.due_date);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const event = {
      summary: task.title, description: task.description || '',
      start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end:   { dateTime: end.toISOString(),   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    };
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Calendar API error'); }
    const created = await res.json();
    await apiFetch(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ calendar_event_id: created.id }) });
    const local = allTasks.find(t => t.id === task.id);
    if (local) local.calendar_event_id = created.id;
    toast('Task added to Google Calendar!', 'success');
    renderTasks();
  } catch (err) {
    if (err.message === 'popup_closed_by_user') toast('Calendar authorization cancelled', 'info');
    else toast(`Calendar error: ${err.message}`, 'error');
  }
}

// ── Goal Actions ──────────────────────────────────────────────────────────────

async function addGoal(e) {
  e.preventDefault();
  const title       = document.getElementById('goal-title')?.value.trim();
  const description = document.getElementById('goal-description')?.value.trim() || '';
  const selectedIds = [...document.querySelectorAll('input[name="goal-tasks"]:checked')].map(cb => cb.value);
  if (!title) return;
  if (selectedIds.length < 3) { toast('Select at least 3 tasks for this goal', 'error'); return; }
  try {
    const goalData = await apiFetch('/goals', { method: 'POST', body: JSON.stringify({ title, description }) });
    const goalId = goalData?.goal?.id ?? goalData?.id;
    if (!goalId) throw new Error('Goal creation did not return an ID');
    await Promise.all(selectedIds.map(taskId => apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ goal_id: goalId }) })));
    document.getElementById('goal-form').reset();
    document.getElementById('goal-form-wrapper').style.display = 'none';
    toast('Goal created!', 'success');
    await Promise.all([loadTasks(), loadGoals()]);
  } catch (err) { toast(err.message, 'error'); }
}

async function checkGoalCompletion(goalId) {
  const { pct } = getGoalProgress(goalId);
  const goal = allGoals.find(g => g.id === goalId);
  if (!goal || goal.completed || pct < 100) return;
  try {
    const data = await apiFetch(`/goals/${goalId}`, { method: 'PUT', body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }) });
    goal.completed = true;
    if (data?.pointsAwarded) {
      toast(`Goal complete! +${data.pointsAwarded.points} pts`, 'success');
      document.getElementById('sidebar-points').textContent = data.pointsAwarded.total;
      document.getElementById('header-points').innerHTML = `<i data-lucide="star" style="width:14px;height:14px;"></i> ${data.pointsAwarded.total} pts`;
      lucide.createIcons();
    } else { toast(`Goal "${goal.title}" complete!`, 'success'); }
    toastAchievements(data?.newAchievements);
    await loadGoals();
    if (document.getElementById('view-achievements').style.display !== 'none') await loadAchievements();
    if (document.getElementById('view-reports').style.display !== 'none') renderReports();
  } catch (err) { console.error('Goal completion failed:', err.message); }
}

async function deleteGoal(goalId) {
  try {
    const goalTasks = allTasks.filter(t => t.goal_id === goalId);
    await Promise.all(goalTasks.map(t => apiFetch(`/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify({ goal_id: null }) })));
    await apiFetch(`/goals/${goalId}`, { method: 'DELETE' });
    toast('Goal deleted', 'info');
    await Promise.all([loadTasks(), loadGoals()]);
  } catch (err) { toast(err.message, 'error'); }
}

// ── Event Delegation ──────────────────────────────────────────────────────────

document.getElementById('tasks-container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'complete')  updateTaskStatus(id, 'completed');
  if (action === 'progress')  updateTaskStatus(id, 'in_progress');
  if (action === 'delete')    deleteTask(id);
  if (action === 'calendar') { const task = allTasks.find(t => t.id === id); if (task) addTaskToCalendar(task); }
});

document.getElementById('goals-container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'delete-goal') deleteGoal(id);
});

// ── Sidebar Nav ───────────────────────────────────────────────────────────────

document.querySelectorAll('.sidebar-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('view-tasks').style.display        = view === 'tasks'        ? '' : 'none';
    document.getElementById('view-goals').style.display        = view === 'goals'        ? '' : 'none';
    document.getElementById('view-achievements').style.display = view === 'achievements' ? '' : 'none';
    document.getElementById('view-reports').style.display      = view === 'reports'      ? '' : 'none';
    if (view === 'goals')        { loadGoals(); renderGoalTaskPicker(); updateGoalTaskCount(); }
    if (view === 'achievements') { loadAchievements(); }
    if (view === 'reports')      { renderReports(); }
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
  const isHidden = wrapper.style.display === 'none';
  wrapper.style.display = isHidden ? '' : 'none';
  if (isHidden) { renderGoalTaskPicker(); updateGoalTaskCount(); }
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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession();
  if (!session) return;
  const authStatus = document.getElementById('auth-status');
  if (authStatus) authStatus.textContent = session.user.email;

  await Promise.all([loadCategories(), loadTasks(), loadGoals(), loadStats(), loadNotifications()]);
});

async function loadNotifications() {
  try {
    const data = await apiFetch('/notifications');
    if (!data) return;
    renderNotifications(data.notifications ?? []);
  } catch (err) {
    console.error('Notifications failed:', err.message);
  }
}

function renderNotifications(notifs) {
  const dropdown = document.getElementById('notif-dropdown');
  const countEl = document.getElementById('notif-count');

  if (!dropdown || !countEl) return;

  dropdown.innerHTML = '';

  const unread = notifs.filter(n => !n.is_read).length;

  if (unread > 0) {
    countEl.style.display = 'block';
    countEl.textContent = unread;
  } else {
    countEl.style.display = 'none';
  }

  notifs.forEach(n => {
    const div = document.createElement('div');

    div.innerHTML = `
      <div style="padding:10px;">
        <p style="margin:0;">${escapeHtml(n.message)}</p>
        <small>${new Date(n.created_at).toLocaleString()}</small>
      </div>
    `;

    div.style.borderBottom = '1px solid #eee';
    div.style.cursor = 'pointer';
    div.style.background = n.is_read ? '#fff' : '#f0f8ff';

    div.onclick = () => markNotificationRead(n.id);

    dropdown.appendChild(div);
  });
}

async function markNotificationRead(id) {
  try {
    await apiFetch(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: true })
    });

    await loadNotifications();
  } catch (err) {
    console.error(err.message);
  }
}

document.getElementById('notif-bell')?.addEventListener('click', () => {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;

 const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isHidden ? 'block' : 'none';
});