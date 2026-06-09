 JS
// ============================================================
//  FinSmart AI — app.js
//  Core logic: expenses, charts, budget, savings goal
// ============================================================
 
/* ── State ──────────────────────────────────────────── */
let state = {
  user: '',
  monthlyBudget: 8000,
  expenses: [],
  categoryBudgets: { Food: 2800, Transport: 1600, Study: 1200, Entertainment: 1440, Health: 960, Other: 0 },
  goal: { name: 'New Laptop', target: 50000, saved: 18200 }
};
 
/* ── Constants ──────────────────────────────────────── */
const CAT_COLORS = {
  Food: '#1D9E75', Transport: '#378ADD', Study: '#7F77DD',
  Entertainment: '#D85A30', Health: '#D4537E', Other: '#888780'
};
const CAT_ICONS = {
  Food: '🍜', Transport: '🚌', Study: '📚',
  Entertainment: '🎮', Health: '💊', Other: '💼'
};
const CAT_BADGE_STYLES = {
  Food:          'background:#E1F5EE;color:#0F6E56',
  Transport:     'background:#E6F1FB;color:#185FA5',
  Study:         'background:#EEEDFE;color:#534AB7',
  Entertainment: 'background:#FAECE7;color:#993C1D',
  Health:        'background:#FBEAF0;color:#993556',
  Other:         'background:#F1EFE8;color:#5F5E5A'
};
 
let pieChartInstance = null;
let lineChartInstance = null;
 
/* ── Bootstrap ───────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  loadState();
 
  // Set today's date default on expense form
  const dateInput = document.getElementById('expDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
 
  // Set filter month default
  const monthInput = document.getElementById('filterMonth');
  if (monthInput) {
    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
 
  // If we have a saved user, skip login
  if (state.user) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initApp();
  }
});
 
/* ── Login ───────────────────────────────────────────── */
function startApp() {
  const name = document.getElementById('loginName').value.trim();
  const budget = parseFloat(document.getElementById('loginBudget').value) || 8000;
  if (!name) { alert('Please enter your name!'); return; }
  state.user = name;
  state.monthlyBudget = budget;
  saveState();
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  initApp();
}
 
function logout() {
  if (!confirm('Logout? Your data will be cleared.')) return;
  localStorage.removeItem('finsmart_state');
  location.reload();
}
 
/* ── Init ────────────────────────────────────────────── */
function initApp() {
  document.getElementById('userChip').textContent = `👤 ${state.user}`;
  setGreeting();
  setDateBadge();
  renderDashboard();
  renderExpenseTable();
  renderBudgetSliders();
  renderGoalDisplay();
  renderGithubSteps();
}
 
function setGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashGreeting').textContent = `${greet}, ${state.user}! 👋`;
}
 
function setDateBadge() {
  const d = new Date();
  document.getElementById('todayDate').textContent =
    d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
 
/* ── Navigation ──────────────────────────────────────── */
function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'expenses') renderExpenseTable();
}
 
/* ── Dashboard ───────────────────────────────────────── */
function renderDashboard() {
  const spent = totalSpentThisMonth();
  const remaining = state.monthlyBudget - spent;
  const savingsRate = state.monthlyBudget > 0
    ? Math.max(0, Math.round((remaining / state.monthlyBudget) * 100))
    : 0;
 
  document.getElementById('metricBudget').textContent = fmt(state.monthlyBudget);
  document.getElementById('metricSpent').textContent = fmt(spent);
  document.getElementById('metricRemaining').textContent = fmt(remaining);
  document.getElementById('metricSavings').textContent = savingsRate + '%';
  document.getElementById('metricRemaining').className =
    'metric-value ' + (remaining < 0 ? 'danger' : remaining < state.monthlyBudget * 0.2 ? 'warning' : 'success');
 
  renderPieChart();
  renderLineChart();
  renderBudgetBars();
  renderRecentTransactions();
}
 
function totalSpentThisMonth() {
  const now = new Date();
  return state.expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);
}
 
function spentByCategory() {
  const now = new Date();
  const map = {};
  Object.keys(CAT_COLORS).forEach(c => map[c] = 0);
  state.expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.amount; });
  return map;
}
 
function renderPieChart() {
  const spent = spentByCategory();
  const cats = Object.keys(CAT_COLORS).filter(c => spent[c] > 0);
  const data = cats.map(c => spent[c]);
  const colors = cats.map(c => CAT_COLORS[c]);
 
  // Legend
  const legendEl = document.getElementById('pieLegend');
  legendEl.innerHTML = cats.map((c, i) =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      ${c}: ${fmt(data[i])}
    </div>`
  ).join('');
 
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();
  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '62%'
    }
  });
}
 
function renderLineChart() {
  // Build weekly data for current month
  const now = new Date();
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const weeklyData = [0, 0, 0, 0];
  state.expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      weeklyData[week] += e.amount;
    }
  });
 
  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChartInstance) lineChartInstance.destroy();
  lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [{
        label: 'Spent (₹)',
        data: weeklyData,
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29,158,117,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1D9E75',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { callback: v => '₹' + v.toLocaleString('en-IN') },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}
 
function renderBudgetBars() {
  const spent = spentByCategory();
  const el = document.getElementById('budgetBars');
  el.innerHTML = Object.keys(CAT_COLORS).map(cat => {
    const budget = state.categoryBudgets[cat] || 0;
    const s = spent[cat] || 0;
    if (budget === 0 && s === 0) return '';
    const pct = budget > 0 ? Math.min(100, Math.round((s / budget) * 100)) : (s > 0 ? 100 : 0);
    const col = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#BA7517' : '#1D9E75';
    return `<div class="budget-row">
      <span class="budget-cat">${CAT_ICONS[cat]} ${cat}</span>
      <div class="budget-bar-bg">
        <div class="budget-bar" style="width:${pct}%;background:${col}"></div>
      </div>
      <span class="budget-pct" style="color:${col}">${pct}%</span>
      <span class="budget-amounts">${fmt(s)} / ${fmt(budget)}</span>
    </div>`;
  }).join('');
}
 
function renderRecentTransactions() {
  const recent = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const el = document.getElementById('recentTransactions');
  if (recent.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:1rem">No expenses yet. Add some in the Expenses tab!</p>';
    return;
  }
  el.innerHTML = recent.map(e => `
    <div class="transaction-item">
      <div class="tx-icon" style="background:${CAT_COLORS[e.cat]}20">
        ${CAT_ICONS[e.cat] || '💼'}
      </div>
      <div class="tx-details">
        <div class="tx-name">${e.name}</div>
        <div class="tx-meta">${formatDate(e.date)} · <span class="cat-badge" style="${CAT_BADGE_STYLES[e.cat]}">${e.cat}</span></div>
      </div>
      <div class="tx-amount" style="color:var(--red)">−${fmt(e.amount)}</div>
    </div>
  `).join('');
}
 
/* ── Expenses ────────────────────────────────────────── */
function addExpense() {
  const name   = document.getElementById('expName').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value);
  const cat    = document.getElementById('expCat').value;
  const date   = document.getElementById('expDate').value;
  const fb     = document.getElementById('expFeedback');
 
  if (!name || !amount || !date) { fb.textContent = '⚠️ Please fill all fields.'; fb.style.color = 'var(--red)'; return; }
  if (amount <= 0) { fb.textContent = '⚠️ Amount must be positive.'; fb.style.color = 'var(--red)'; return; }
 
  const expense = { id: Date.now(), name, amount, cat, date };
  state.expenses.push(expense);
  saveState();
 
  document.getElementById('expName').value = '';
  document.getElementById('expAmount').value = '';
 
  fb.style.color = 'var(--green)';
  fb.textContent = `✓ Added ₹${amount} for "${name}"`;
  setTimeout(() => fb.textContent = '', 3000);
 
  renderExpenseTable();
  renderDashboard();
}
 
function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveState();
  renderExpenseTable();
  renderDashboard();
}
 
function renderExpenseTable() {
  const filterCat   = document.getElementById('filterCat')?.value || '';
  const filterMonth = document.getElementById('filterMonth')?.value || '';
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return;
 
  let list = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (filterCat)   list = list.filter(e => e.cat === filterCat);
  if (filterMonth) list = list.filter(e => e.date.startsWith(filterMonth));
 
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem">No expenses found.</td></tr>`;
    return;
  }
 
  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td>${e.name}</td>
      <td><span class="cat-badge" style="${CAT_BADGE_STYLES[e.cat] || ''}">${CAT_ICONS[e.cat] || ''} ${e.cat}</span></td>
      <td style="font-weight:600;color:var(--red)">−${fmt(e.amount)}</td>
      <td><button class="delete-btn" onclick="deleteExpense(${e.id})" title="Delete">🗑</button></td>
    </tr>
  `).join('');
}
 
function exportCSV() {
  const rows = [['Date', 'Description', 'Category', 'Amount (INR)']];
  state.expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(e => rows.push([e.date, e.name, e.cat, e.amount]));
 
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `finsmart_expenses_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
 
/* ── Budget ──────────────────────────────────────────── */
function renderBudgetSliders() {
  const el = document.getElementById('budgetSliders');
  if (!el) return;
  el.innerHTML = Object.keys(CAT_COLORS).map(cat => `
    <div class="slider-row">
      <div class="slider-header">
        <span>${CAT_ICONS[cat]} ${cat}</span>
        <span id="lbl-${cat}">₹${(state.categoryBudgets[cat] || 0).toLocaleString('en-IN')}</span>
      </div>
      <input type="range" min="0" max="5000" step="100"
        value="${state.categoryBudgets[cat] || 0}"
        oninput="updateSliderLabel('${cat}', this.value)" />
    </div>
  `).join('');
}
 
function updateSliderLabel(cat, val) {
  document.getElementById('lbl-' + cat).textContent = '₹' + parseInt(val).toLocaleString('en-IN');
}
 
function saveBudgets() {
  Object.keys(CAT_COLORS).forEach(cat => {
    const input = document.querySelector(`#budgetSliders input[oninput*="'${cat}'"]`);
    if (input) state.categoryBudgets[cat] = parseFloat(input.value) || 0;
  });
  state.monthlyBudget = Object.values(state.categoryBudgets).reduce((s, v) => s + v, 0);
  saveState();
  const fb = document.getElementById('budgetFeedback');
  fb.textContent = '✓ Budgets saved! Total: ' + fmt(state.monthlyBudget);
  setTimeout(() => fb.textContent = '', 3000);
  renderDashboard();
}
 
/* ── Savings Goal ────────────────────────────────────── */
function updateGoal() {
  const name   = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const saved  = parseFloat(document.getElementById('goalSaved').value) || 0;
  if (!name || !target) return;
  state.goal = { name, target, saved };
  saveState();
  renderGoalDisplay();
}
 
function renderGoalDisplay() {
  const el = document.getElementById('goalDisplay');
  if (!el) return;
  const { name, target, saved } = state.goal;
  if (!target) { el.innerHTML = ''; return; }
  const pct = Math.min(100, Math.round((saved / target) * 100));
  const remaining = target - saved;
 
  // Months to goal based on this month's savings (approx)
  const monthlySpent = totalSpentThisMonth();
  const monthlySaving = Math.max(0, state.monthlyBudget - monthlySpent);
  const monthsLeft = monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : '∞';
 
  el.innerHTML = `
    <div style="margin-bottom:6px;font-size:13.5px">
      🎯 <strong>${name}</strong> &nbsp;|&nbsp; Target: <strong>${fmt(target)}</strong>
      &nbsp;|&nbsp; Saved: <strong style="color:var(--green)">${fmt(saved)}</strong>
      &nbsp;|&nbsp; <span style="background:var(--amber-light);color:var(--amber);font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600">${pct}% reached</span>
    </div>
    <div class="goal-bar-bg"><div class="goal-bar" style="width:${pct}%"></div></div>
    <div class="goal-meta">Remaining: ${fmt(remaining)} · At current rate, reach goal in ~${monthsLeft} month${monthsLeft === 1 ? '' : 's'}</div>
  `;
 
  // Pre-fill form
  document.getElementById('goalName').value = name;
  document.getElementById('goalTarget').value = target;
  document.getElementById('goalSaved').value = saved;
}
 
/* ── GitHub Steps ────────────────────────────────────── */
function renderGithubSteps() {
  const el = document.getElementById('githubSteps');
  if (!el) return;
  const steps = [
    {
      t: 'Install Git',
      d: 'Download Git from <code>git-scm.com/downloads</code> and install it. Verify by opening Terminal (VS Code) and running: <code>git --version</code>'
    },
    {
      t: 'Open project in VS Code',
      d: 'In VS Code: <code>File → Open Folder</code> → select your <code>ai-finance-tracker</code> folder. All project files should appear in the Explorer panel.'
    },
    {
      t: 'Install GitHub extension in VS Code',
      d: 'Go to Extensions (Ctrl+Shift+X) → search <code>GitHub Pull Requests</code> → Install. Then press <code>Ctrl+Shift+P</code> → type <code>GitHub: Sign in</code> → authenticate.'
    },
    {
      t: 'Create a .gitignore file',
      d: 'In the project root, create a file named <code>.gitignore</code> and add: <code>node_modules/</code> on one line and <code>.env</code> on another. This prevents sensitive/bulk files from being pushed.'
    },
    {
      t: 'Initialise Git repository',
      d: 'Open Terminal in VS Code (<code>Ctrl+`</code>) and run:<br><code>git init</code><br><code>git add .</code><br><code>git commit -m "Initial commit: FinSmart AI capstone"</code>'
    },
    {
      t: 'Create repo on GitHub.com',
      d: 'Go to <code>github.com</code> → click <code>+</code> → <code>New repository</code> → name it <code>ai-finance-tracker</code> → set to Public → click <code>Create repository</code>. Copy the HTTPS URL shown.'
    },
    {
      t: 'Connect local repo to GitHub',
      d: 'Back in VS Code terminal:<br><code>git remote add origin https://github.com/YOUR_USERNAME/ai-finance-tracker.git</code><br><code>git branch -M main</code><br><code>git push -u origin main</code>'
    },
    {
      t: 'Future pushes (easy way via VS Code)',
      d: 'Click the <code>Source Control</code> icon (branch icon, left sidebar) → click <code>+</code> next to changed files → type a commit message → click <code>✓ Commit</code> → click <code>Sync Changes</code>. Done! ✅'
    },
    {
      t: 'Enable GitHub Pages (live demo link)',
      d: 'On GitHub → your repo → <code>Settings → Pages → Source: Deploy from branch → main → / (root) → Save</code>. Your app goes live at <code>https://YOUR_USERNAME.github.io/ai-finance-tracker</code> in ~1 minute!'
    }
  ];
 
  el.innerHTML = steps.map((s, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <div>
        <div class="step-title">${s.t}</div>
        <div class="step-desc">${s.d}</div>
      </div>
    </div>
  `).join('');
}
 
/* ── Helpers ─────────────────────────────────────────── */
function fmt(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
 
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
 
/* ── Persistence ─────────────────────────────────────── */
function saveState() {
  try { localStorage.setItem('finsmart_state', JSON.stringify(state)); } catch (e) {}
}
 
function loadState() {
  try {
    const saved = localStorage.getItem('finsmart_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (e) {}
 
  // Seed sample data if no expenses
  if (state.user && state.expenses.length === 0) seedSampleData();
}
 
function seedSampleData() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const samples = [
    { id: 1, name: 'Canteen lunch', amount: 120, cat: 'Food',          date: `${y}-${m}-02` },
    { id: 2, name: 'Monthly bus pass', amount: 200, cat: 'Transport',  date: `${y}-${m}-01` },
    { id: 3, name: 'Stationery & pens', amount: 350, cat: 'Study',     date: `${y}-${m}-03` },
    { id: 4, name: 'OTT subscription', amount: 199, cat: 'Entertainment', date: `${y}-${m}-04` },
    { id: 5, name: 'Pharmacy', amount: 95, cat: 'Health',              date: `${y}-${m}-05` },
    { id: 6, name: 'Breakfast & snacks', amount: 210, cat: 'Food',     date: `${y}-${m}-06` },
    { id: 7, name: 'Auto to college', amount: 80, cat: 'Transport',    date: `${y}-${m}-07` },
    { id: 8, name: 'Online course', amount: 499, cat: 'Study',         date: `${y}-${m}-08` },
    { id: 9, name: 'Movie outing', amount: 320, cat: 'Entertainment',  date: `${y}-${m}-09` },
  ];
  state.expenses = samples;
  saveState();
}
 
