const AI_CONFIG = {
  baseUrl: 'https://apidev.navigatelabsai.com',
  apiKey:  'sk-Q2mK7JBcGPLoGON47j__4A',
  model:   'claude-sonnet-4-20250514',
  maxTokens: 400
};
 
/* ── Chat History ────────────────────────────────────── */
let chatHistory = [];
 
/* ── System Prompt Builder ───────────────────────────── */
function buildSystemPrompt() {
  const spent      = typeof totalSpentThisMonth === 'function' ? totalSpentThisMonth() : 0;
  const budget     = state?.monthlyBudget || 8000;
  const remaining  = budget - spent;
  const catSpent   = typeof spentByCategory === 'function' ? spentByCategory() : {};
  const catBudgets = state?.categoryBudgets || {};
  const goal       = state?.goal || {};
 
  const catSummary = Object.entries(catSpent)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ₹${v} spent / ₹${catBudgets[k] || 0} budgeted`)
    .join(', ');
 
  return `You are FinSmart AI — a friendly, practical financial advisor for Indian college students.
 
Student profile:
- Name: ${state?.user || 'Student'}
- Monthly budget: ₹${budget.toLocaleString('en-IN')}
- Spent this month: ₹${spent.toLocaleString('en-IN')}
- Remaining: ₹${remaining.toLocaleString('en-IN')}
- Category breakdown: ${catSummary || 'No expenses logged yet'}
- Savings goal: ${goal.name || 'Not set'} — Target ₹${(goal.target||0).toLocaleString('en-IN')}, Saved ₹${(goal.saved||0).toLocaleString('en-IN')}
 
Guidelines:
- Give short, actionable advice (3–5 sentences max unless a breakdown is requested)
- Use Indian Rupees (₹) for all amounts
- Be encouraging and practical — suggest realistic actions for a student
- Reference the student's actual spending data when relevant
- If they're overspending a category, point it out with a specific suggestion
- Keep tone friendly and conversational`;
}
 
/* ── Send Chat ───────────────────────────────────────── */
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg   = input.value.trim();
  if (!msg) return;
 
  input.value = '';
  appendMessage('user', msg);
  appendMessage('ai', 'Thinking...', 'thinking', 'thinkingMsg');
 
  chatHistory.push({ role: 'user', content: msg });
 
  try {
    const response = await fetch(`${AI_CONFIG.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         AI_CONFIG.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        system:     buildSystemPrompt(),
        messages:   chatHistory
      })
    });
 
    const data = await response.json();
 
    // Remove thinking bubble
    const thinking = document.getElementById('thinkingMsg');
    if (thinking) thinking.remove();
 
    if (!response.ok) {
      const errMsg = data?.error?.message || `API error ${response.status}`;
      appendMessage('ai', `⚠️ ${errMsg}`);
      chatHistory.pop(); // remove failed user message
      return;
    }
 
    const reply = data?.content?.[0]?.text || 'Sorry, I could not generate a response.';
    chatHistory.push({ role: 'assistant', content: reply });
 
    // Keep history to last 10 turns (20 messages) to avoid token overflow
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
 
    appendMessage('ai', reply);
 
  } catch (err) {
    const thinking = document.getElementById('thinkingMsg');
    if (thinking) thinking.remove();
    appendMessage('ai', `⚠️ Connection error: ${err.message}. Check your network and API key.`);
    chatHistory.pop();
  }
}
 
/* ── Quick Ask ───────────────────────────────────────── */
function quickAsk(prompt) {
  document.getElementById('chatInput').value = prompt;
  sendChat();
}
 
/* ── Append Message ──────────────────────────────────── */
function appendMessage(role, text, extraClass = '', id = '') {
  const box = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `msg ${role}${extraClass ? ' ' + extraClass : ''}`;
  if (id) div.id = id;
 
  // Convert markdown-style line breaks
  div.innerHTML = text.replace(/\n/g, '<br>');
 
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
 
