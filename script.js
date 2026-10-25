// Cosmic AI — Foundational IDE & Multi-Agent Codespace System
// API keys are loaded at runtime from .env/keys.json (gitignored) or via Settings modal.

const DEFAULT_KEYS = { groq: '', gemini: '', nvidia: '' };
const KEYS = { ...DEFAULT_KEYS };

// Agent config: url, key ref, model, max_tokens, type
const AGENT_CFG = {
  groq:      { url: 'https://api.groq.com/openai/v1/chat/completions',       key: 'groq',   model: 'openai/gpt-oss-120b',                    tokens: 3500, type: 'openai', name: 'Groq' },
  'groq-fast':{ url: 'https://api.groq.com/openai/v1/chat/completions',      key: 'groq',   model: 'qwen/qwen3.8-27b',                       tokens: 3000, type: 'openai', name: 'Groq Fast' },
  nvidia:    { url: 'https://integrate.api.nvidia.com/v1/chat/completions',   key: 'nvidia', model: 'meta/llama-3.2-11b-vision-instruct',     tokens: 2500, type: 'openai', name: 'NVIDIA' },
  gemini:    { url: null,                                                      key: 'gemini', model: 'gemini-2.5-flash',                      tokens: null, type: 'gemini', name: 'Gemini' }
};

let enhancerActive = false, isStreaming = false, activeFile = 'index.html';
let sessions = [], currentSessionId = null, currentHistory = [];
let files = { 'index.html': '', 'style.css': '', 'script.js': '' };

const $ = id => document.getElementById(id);
const enhancerToggleBtn = $('enhancerToggleBtn'), enhancerBadge = $('enhancerBadge'), enhancerStatus = $('enhancerStatus');
const agentSelect = $('agentSelect'), runPreviewBtn = $('runPreviewBtn'), clearChatBtn = $('clearChatBtn');
const newChatBtn = $('newChatBtn'), deleteHistoryBtn = $('deleteHistoryBtn'), hamburgerBtn = $('hamburgerBtn');
const sidebar = $('sidebar'), sidebarOverlay = $('sidebarOverlay'), workspaceGrid = $('workspaceGrid');
const newFileBtn = $('newFileBtn'), resetFilesBtn = $('resetFilesBtn'), clearEditorCodeBtn = $('clearEditorCodeBtn');
const openSettingsBtn = $('openSettingsBtn'), sidebarSettingsBtn = $('sidebarSettingsBtn');
const settingsModalOverlay = $('settingsModalOverlay'), settingsCloseBtn = $('settingsCloseBtn');
const settingsSaveBtn = $('settingsSaveBtn'), settingsResetBtn = $('settingsResetBtn');
const settingGroqKey = $('settingGroqKey'), settingGeminiKey = $('settingGeminiKey'), settingNvidiaKey = $('settingNvidiaKey');
const statusGroqKey = $('statusGroqKey'), statusGeminiKey = $('statusGeminiKey'), statusNvidiaKey = $('statusNvidiaKey');
const editorTabs = $('editorTabs'), sidebarFileList = $('sidebarFileList'), chatHistory = $('chatHistory');
const modeCodeBtn = $('modeCodeBtn'), modePreviewBtn = $('modePreviewBtn'), copyEditorCodeBtn = $('copyEditorCodeBtn');
const editorCodeView = $('editorCodeView'), editorPreviewView = $('editorPreviewView');
let previewIframe = $('previewIframe');
const lineNumbers = $('lineNumbers'), codeTextarea = $('codeTextarea'), statusFilename = $('statusFilename'), statusInfo = $('statusInfo');
const messagesEl = $('messages'), welcomeEl = $('welcome'), messageInput = $('messageInput'), sendBtn = $('sendBtn');

function renderMarkdown(text) {
  try { return (typeof marked !== 'undefined') ? marked.parse(text) : escapeHtml(text); }
  catch (_) { return escapeHtml(text); }
}

function getSystemPrompt() {
  const stateParts = Object.keys(files)
    .filter(f => files[f]?.trim())
    .map(f => `--- Current ${f} ---\n${files[f]}`);
  const stateMsg = stateParts.length
    ? `\n\nCURRENT CODESPACE:\n${stateParts.join('\n\n')}\nBuild upon these existing files.`
    : `\n\nCURRENT CODESPACE: Empty. Build from scratch.`;
  return `You are Cosmic AI, an expert foundational web developer inside Cosmic AI Studio.
Codespace files: index.html, style.css, script.js.
Rules:
- Foundational Vanilla HTML5, CSS3, JavaScript only. No frameworks unless asked.
- Always link <link rel="stylesheet" href="style.css"> and <script src="script.js"></script>.
- Separate code into \`\`\`html, \`\`\`css, \`\`\`javascript blocks. The IDE auto-writes them to the respective files.
- Write clean, complete, working code.${stateMsg}`;
}

async function init() {
  migrateStorage();
  loadStoredKeys();
  loadWindowKeys();
  await loadEnvKeys();
  loadSessionsFromStorage();
  setupEvents();
}

function loadWindowKeys() {
  if (typeof window !== 'undefined' && window.COSMIC_KEYS) {
    if (window.COSMIC_KEYS.GROQ_API_KEY) KEYS.groq = window.COSMIC_KEYS.GROQ_API_KEY.trim();
    if (window.COSMIC_KEYS.GEMINI_API_KEY) KEYS.gemini = window.COSMIC_KEYS.GEMINI_API_KEY.trim();
    if (window.COSMIC_KEYS.NVIDIA_API_KEY) KEYS.nvidia = window.COSMIC_KEYS.NVIDIA_API_KEY.trim();
    try { localStorage.setItem('cosmic_keys', JSON.stringify(KEYS)); } catch (_) {}
  }
}

function migrateStorage() {
  try {
    if (localStorage.getItem('cosmic_files')?.includes('Cosmic AI Studio'))
      localStorage.removeItem('cosmic_files');
    const raw = localStorage.getItem('cosmic_sessions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let changed = false;
        parsed.forEach(s => {
          if (!s.id) { s.id = 'chat_' + Math.random().toString(36).slice(2, 9); changed = true; }
          if (!s.files) { s.files = { 'index.html': '', 'style.css': '', 'script.js': '' }; changed = true; }
          else if (s.files['index.html']?.includes('Cosmic AI Studio')) {
            s.files = { 'index.html': '', 'style.css': '', 'script.js': '' }; changed = true;
          }
        });
        if (changed) localStorage.setItem('cosmic_sessions', JSON.stringify(parsed));
      }
    }
  } catch (_) {}
}

function loadStoredKeys() {
  try {
    const p = JSON.parse(localStorage.getItem('cosmic_keys') || '{}');
    ['groq','gemini','nvidia'].forEach(k => { if (p[k]?.trim()) KEYS[k] = p[k].trim(); });
  } catch (_) {}
}

async function loadEnvKeys() {
  try {
    const res = await fetch('.env/keys.json');
    if (!res.ok) return;
    const d = await res.json();
    if (d.GROQ_API_KEY) KEYS.groq = d.GROQ_API_KEY;
    if (d.GEMINI_API_KEY) KEYS.gemini = d.GEMINI_API_KEY;
    if (d.NVIDIA_API_KEY) KEYS.nvidia = d.NVIDIA_API_KEY;
    try { localStorage.setItem('cosmic_keys', JSON.stringify(KEYS)); } catch (_) {}
  } catch (_) {}
}

function openSettingsModal() {
  settingGroqKey.value = KEYS.groq || '';
  settingGeminiKey.value = KEYS.gemini || '';
  settingNvidiaKey.value = KEYS.nvidia || '';
  updateKeyStatuses();
  settingsModalOverlay.classList.add('show');
}
function closeSettingsModal() { settingsModalOverlay.classList.remove('show'); }

function updateKeyStatuses() {
  [[settingGroqKey, statusGroqKey], [settingGeminiKey, statusGeminiKey], [settingNvidiaKey, statusNvidiaKey]]
    .forEach(([inp, el]) => {
      if (!el) return;
      const ok = inp.value.trim();
      el.textContent = ok ? 'Configured' : 'Missing';
      el.className = `form-status ${ok ? 'ok' : 'missing'}`;
    });
}

function saveSettings() {
  KEYS.groq = settingGroqKey.value.trim();
  KEYS.gemini = settingGeminiKey.value.trim();
  KEYS.nvidia = settingNvidiaKey.value.trim();
  try { localStorage.setItem('cosmic_keys', JSON.stringify(KEYS)); } catch (_) {}
  closeSettingsModal();
  showToast('API credentials saved');
}

function resetSettingsToDefaults() {
  settingGroqKey.value = DEFAULT_KEYS.groq;
  settingGeminiKey.value = DEFAULT_KEYS.gemini;
  settingNvidiaKey.value = DEFAULT_KEYS.nvidia;
  updateKeyStatuses();
  showToast('Default credentials restored in form');
}

// Session Management
function getCurrentSession() { return sessions.find(s => s.id === currentSessionId) || null; }

function createNewSession(switchToIt = true) {
  const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const s = { id, title: 'New Chat', createdAt: Date.now(), updatedAt: Date.now(), history: [], files: { 'index.html': '', 'style.css': '', 'script.js': '' }, activeFile: 'index.html' };
  sessions.unshift(s);
  saveAllSessions();
  if (switchToIt) switchToSession(id);
  return s;
}

function switchToSession(id) {
  if (currentSessionId && currentSessionId !== id) saveCurrentSession();
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  currentSessionId = id;
  currentHistory = [...(session.history || [])];
  files = { 'index.html': '', 'style.css': '', 'script.js': '', ...(session.files || {}) };
  activeFile = (session.activeFile && files[session.activeFile] !== undefined) ? session.activeFile : 'index.html';
  messagesEl.querySelectorAll('.message-row').forEach(r => r.remove());
  if (!currentHistory.length) {
    welcomeEl.classList.remove('hidden');
  } else {
    welcomeEl.classList.add('hidden');
    currentHistory.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.content));
  }
  openFile(activeFile);
  updatePreviewIframe();
  try { localStorage.setItem('cosmic_active_session', id); } catch (_) {}
  renderHistory();
  closeSidebar();
}

function saveCurrentSession() {
  if (!currentSessionId) return;
  saveCurrentFileContent();
  const s = getCurrentSession();
  if (s) { s.files = { ...files }; s.activeFile = activeFile; s.history = [...currentHistory]; s.updatedAt = Date.now(); saveAllSessions(); }
}

function saveAllSessions() {
  try { localStorage.setItem('cosmic_sessions', JSON.stringify(sessions)); if (currentSessionId) localStorage.setItem('cosmic_active_session', currentSessionId); } catch (_) {}
}

function loadSessionsFromStorage() {
  try { sessions = JSON.parse(localStorage.getItem('cosmic_sessions') || '[]'); } catch (_) { sessions = []; }
  if (!sessions.length) createNewSession(false);
  const saved = localStorage.getItem('cosmic_active_session');
  switchToSession((sessions.find(s => s.id === saved) || sessions[0]).id);
}

function deleteSession(id) {
  if (!confirm('Delete this chat and its codespace?')) return;
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions.splice(idx, 1);
  if (currentSessionId === id) sessions.length ? switchToSession(sessions[0].id) : createNewSession(true);
  else { saveAllSessions(); renderHistory(); }
  showToast('Chat and codespace deleted');
}

function renderHistory() {
  chatHistory.innerHTML = '';
  sessions.forEach(s => {
    const item = document.createElement('div');
    item.className = `history-item${s.id === currentSessionId ? ' active' : ''}`;
    const span = document.createElement('span');
    span.textContent = s.title || 'New Chat';
    item.appendChild(span);
    const del = document.createElement('button');
    del.className = 'history-item-del'; del.innerHTML = '&times;'; del.title = 'Delete';
    del.onclick = e => { e.stopPropagation(); deleteSession(s.id); };
    item.appendChild(del);
    item.onclick = () => { if (s.id !== currentSessionId) switchToSession(s.id); closeSidebar(); };
    chatHistory.appendChild(item);
  });
}

function startNewChat() {
  saveCurrentSession(); createNewSession(true);
  messageInput.value = ''; messageInput.style.height = 'auto'; updateSendBtn();
  showToast('New chat & clean codespace ready');
}

function clearChat() {
  currentHistory = [];
  const s = getCurrentSession();
  if (s) { s.history = []; saveAllSessions(); }
  messagesEl.querySelectorAll('.message-row').forEach(r => r.remove());
  welcomeEl.classList.remove('hidden');
  messageInput.value = ''; messageInput.style.height = 'auto'; updateSendBtn();
  showToast('Chat cleared');
}

// File Operations
const CORE_FILES = ['index.html', 'style.css', 'script.js'];

function renderFileTabs() {
  editorTabs.innerHTML = '';
  Object.keys(files).forEach(name => {
    const tab = document.createElement('div');
    tab.className = `editor-tab${name === activeFile ? ' active' : ''}`;
    tab.textContent = name;
    tab.onclick = () => { saveCurrentFileContent(); openFile(name); };
    editorTabs.appendChild(tab);
  });
}

function renderSidebarFiles() {
  sidebarFileList.innerHTML = '';
  Object.keys(files).forEach(name => {
    const item = document.createElement('div');
    item.className = `file-item${name === activeFile ? ' active' : ''}`;
    const label = document.createElement('span');
    label.textContent = name;
    item.appendChild(label);
    if (!CORE_FILES.includes(name)) {
      const del = document.createElement('button');
      del.className = 'file-item-del'; del.innerHTML = '&times;'; del.title = `Delete ${name}`;
      del.onclick = e => { e.stopPropagation(); deleteFile(name); };
      item.appendChild(del);
    }
    item.onclick = () => { saveCurrentFileContent(); openFile(name); setView('split'); closeSidebar(); };
    sidebarFileList.appendChild(item);
  });
}

const PLACEHOLDERS = { 'index.html': '<!-- HTML code will be written here by AI -->', 'style.css': '/* CSS styles will be written here by AI */', 'script.js': '// JavaScript logic will be written here by AI' };

function openFile(name) {
  if (files[name] === undefined) name = Object.keys(files)[0] || 'index.html';
  activeFile = name;
  const s = getCurrentSession();
  if (s) s.activeFile = name;
  codeTextarea.value = files[name] || '';
  codeTextarea.placeholder = PLACEHOLDERS[name] || `// Code for ${name}...`;
  statusFilename.textContent = name;
  updateLines(); renderFileTabs(); renderSidebarFiles();
}

function saveCurrentFileContent() {
  if (!activeFile || files[activeFile] === undefined) return;
  files[activeFile] = codeTextarea.value;
  const s = getCurrentSession();
  if (s) { if (!s.files) s.files = {}; s.files[activeFile] = codeTextarea.value; saveAllSessions(); }
}

function updateLines() {
  const count = (codeTextarea.value || '').split('\n').length;
  lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  statusInfo.textContent = `Lines: ${count} | UTF-8`;
}

function createNewFile() {
  const name = prompt('Enter new file name (e.g., utils.js):')?.trim();
  if (!name) return;
  saveCurrentFileContent();
  if (files[name] !== undefined) { openFile(name); showToast(`Switched to: ${name}`); return; }
  files[name] = '';
  const s = getCurrentSession();
  if (s) { if (!s.files) s.files = {}; s.files[name] = ''; saveAllSessions(); }
  openFile(name); showToast(`Created ${name}`);
}

function deleteFile(name) {
  if (CORE_FILES.includes(name)) { showToast('Cannot delete foundational files'); return; }
  if (!confirm(`Delete ${name}?`)) return;
  delete files[name];
  const s = getCurrentSession();
  if (s?.files) { delete s.files[name]; saveAllSessions(); }
  if (activeFile === name) activeFile = 'index.html';
  openFile(activeFile); showToast(`Deleted ${name}`);
}

function resetWorkspaceFiles() {
  if (!confirm("Clear this codespace's files?")) return;
  CORE_FILES.forEach(f => files[f] = '');
  const s = getCurrentSession();
  if (s) { s.files = { 'index.html': '', 'style.css': '', 'script.js': '' }; saveAllSessions(); }
  openFile('index.html'); updatePreviewIframe(); showToast('Codespace cleared');
}

function clearEditorCode() {
  if (!confirm(`Clear ${activeFile}?`)) return;
  codeTextarea.value = ''; saveCurrentFileContent(); updateLines(); updatePreviewIframe(); showToast(`Cleared ${activeFile}`);
}

// Preview
function updatePreviewIframe() {
  const container = $('editorPreviewView');
  if (!container) return;
  const html = (files['index.html'] || '')
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script\s+src=["'][^"']*["'][^>]*><\/script>/gi, '');
  const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${files['style.css'] || ''}</style></head><body>${html}<script>${files['script.js'] || ''}<\/script></body></html>`;

  const newIframe = document.createElement('iframe');
  newIframe.className = 'preview-iframe';
  newIframe.id = 'previewIframe';
  newIframe.sandbox = 'allow-scripts allow-modals';
  newIframe.srcdoc = doc;

  container.innerHTML = '';
  container.appendChild(newIframe);
  previewIframe = newIframe;
}

function runPreview() {
  saveCurrentFileContent();
  if (workspaceGrid.classList.contains('mode-chat')) setView('split');
  setMode('preview');
  updatePreviewIframe();
  showToast('Live preview updated');
}

function setMode(mode) {
  modeCodeBtn.classList.toggle('active', mode === 'code');
  modePreviewBtn.classList.toggle('active', mode === 'preview');
  editorCodeView.style.display = mode === 'code' ? 'flex' : 'none';
  editorPreviewView.style.display = mode === 'preview' ? 'flex' : 'none';
  if (mode === 'preview') updatePreviewIframe();
}

function setView(view) {
  $('viewSplitBtn')?.classList.toggle('active', view === 'split');
  $('viewChatBtn')?.classList.toggle('active', view === 'chat');
  workspaceGrid.classList.remove('mode-editor', 'mode-chat');
  if (view === 'chat') workspaceGrid.classList.add('mode-chat');
}

// Code Extraction
function extractCodeBlocks(text) {
  const blocks = {};
  if (!text) return blocks;
  const re = /```([a-zA-Z0-9_\-.: ]*)\n([\s\S]*?)(?:```|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const h = (m[1] || '').trim().toLowerCase();
    const code = m[2]?.trim();
    if (!code) continue;
    let t = h.includes('html') || h.includes('htm') ? 'index.html'
           : h.includes('css') ? 'style.css'
           : (h.includes('javascript') || h.includes('js')) ? 'script.js'
           : null;
    if (!t) {
      const fl = code.split('\n')[0].trim().toLowerCase();
      t = fl.includes('index.html') ? 'index.html' : fl.includes('style.css') ? 'style.css' : fl.includes('script.js') ? 'script.js' : null;
    }
    if (!t && (code.startsWith('<!doctype html') || code.startsWith('<html') || (code.includes('<body') && code.includes('</body>')))) t = 'index.html';
    if (t) blocks[t] = code;
  }
  return blocks;
}

function autoApplyCode(blocks, silent = false) {
  const updated = Object.keys(blocks);
  if (!updated.length) return false;
  const s = getCurrentSession();
  updated.forEach(f => { files[f] = blocks[f]; if (s) { if (!s.files) s.files = {}; s.files[f] = blocks[f]; } });
  saveAllSessions();
  if (blocks[activeFile] !== undefined) { codeTextarea.value = files[activeFile]; updateLines(); }
  renderFileTabs(); renderSidebarFiles(); updatePreviewIframe();
  if (!silent) showToast(`⚡ Auto-written to ${updated.join(', ')}`);
  return true;
}

// Prompt Enhancer
function toggleEnhancer() {
  enhancerActive = !enhancerActive;
  enhancerToggleBtn.classList.toggle('active', enhancerActive);
  enhancerBadge.textContent = enhancerActive ? 'ON' : 'OFF';
  enhancerStatus.textContent = enhancerActive ? 'Enhancer: ACTIVE (Groq)' : 'Enhancer: OFF';
  enhancerStatus.classList.toggle('active', enhancerActive);
  showToast(enhancerActive ? 'Prompt Enhancer activated' : 'Prompt Enhancer disabled');
}

async function enhancePrompt(promptText) {
  if (!KEYS.groq) return promptText;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen/qwen3.8-27b', temperature: 0.5, max_tokens: 500, messages: [
        { role: 'system', content: 'Expert prompt engineer. Expand the user prompt into a concise technical spec for a foundational vanilla web app. Return ONLY the enhanced prompt.' },
        { role: 'user', content: promptText }
      ]})
    });
    if (!res.ok) return promptText;
    return (await res.json()).choices?.[0]?.message?.content?.trim() || promptText;
  } catch (_) { return promptText; }
}

// Unified Agent Call (data-driven)
async function callAgent(agent, history, onChunk, onReasoning) {
  const cfg = AGENT_CFG[agent] || AGENT_CFG.groq;
  const sysPrompt = getSystemPrompt();
  const apiKey = KEYS[cfg.key];
  if (!apiKey) throw new Error(`${cfg.name} API Key missing. Configure it in Settings.`);

  if (cfg.type === 'gemini') {
    const contents = history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: sysPrompt }] } }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error?.message || `Gemini error (${res.status})`); }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try { JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.forEach(p => { if (p.text) { full += p.text; onChunk(full); } }); } catch (_) {}
      }
    }
    return full;
  }

  // OpenAI-compatible (Groq / NVIDIA)
  const res = await fetch(cfg.url, { method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: cfg.model, stream: true, max_tokens: cfg.tokens, messages: [{ role: 'system', content: sysPrompt }, ...history] })
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error?.message || j.detail || j.title || `${cfg.name} error (${res.status})`);
  }
  return await streamOpenAI(res, onChunk, onReasoning);
}

async function streamOpenAI(res, onChunk, onReasoning) {
  const reader = res.body.getReader(); const dec = new TextDecoder(); let full = '', reasoning = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]' || !d) continue;
      try {
        const delta = JSON.parse(d).choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.reasoning && onReasoning) { reasoning += delta.reasoning; onReasoning(reasoning); }
        if (delta.content) { full += delta.content; onChunk(full); }
      } catch (_) {}
    }
  }
  return full;
}

// Chat
async function sendMessage() {
  const raw = messageInput.value.trim();
  if (!raw || isStreaming) return;
  welcomeEl.classList.add('hidden');
  messageInput.value = ''; messageInput.style.height = 'auto'; updateSendBtn();
  appendMessage('user', raw);
  const s = getCurrentSession();
  if (s && (!s.title || s.title === 'New Chat')) { s.title = raw.slice(0, 30) + (raw.length > 30 ? '...' : ''); renderHistory(); }

  let promptToSend = raw, enhancedPrefix = '';
  if (enhancerActive) {
    const t = appendTyping('Enhancing prompt...');
    try { const e = await enhancePrompt(raw); promptToSend = e; enhancedPrefix = `> [Enhanced]\n> ${e.replace(/\n/g, '\n> ')}\n\n---\n\n`; } catch (_) {}
    t.remove();
  }

  currentHistory.push({ role: 'user', content: promptToSend });
  const agent = agentSelect.value;
  const typingEl = appendTyping(`${AGENT_CFG[agent]?.name || 'AI'} is writing...`);
  isStreaming = true;
  try {
    const aiRow = createAiRow(agent); const bubble = aiRow.querySelector('.bubble'); typingEl.remove();
    let fullRes = '', reasoningText = '';
    await callAgent(agent, currentHistory,
      chunk => { fullRes = chunk; renderAiBubble(bubble, enhancedPrefix + fullRes, reasoningText); messagesEl.scrollTop = messagesEl.scrollHeight; autoApplyCode(extractCodeBlocks(fullRes), true); },
      rChunk => { reasoningText = rChunk; renderAiBubble(bubble, enhancedPrefix + fullRes, reasoningText); messagesEl.scrollTop = messagesEl.scrollHeight; }
    );
    currentHistory.push({ role: 'assistant', content: fullRes });
    autoApplyCode(extractCodeBlocks(fullRes), false);
    saveCurrentSession();
  } catch (err) {
    typingEl.remove();
    appendMessage('ai', `**Agent Error (${AGENT_CFG[agent]?.name || agent}):** ${err.message}`);
  }
  isStreaming = false; updateSendBtn();
}

function renderAiBubble(bubble, md, reasoning) {
  let html = '';
  if (reasoning) html = `<div class="thinking-box"><div class="thinking-header" onclick="this.nextElementSibling.classList.toggle('hidden')"><span>Thinking (${reasoning.length} chars)</span><span style="font-size:10px">toggle</span></div><div class="thinking-content">${escapeHtml(reasoning)}</div></div>`;
  bubble.innerHTML = html + renderMarkdown(md);
  setupCodeBlocks(bubble);
}

function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `${role === 'ai' ? '<div class="msg-avatar">AI</div>' : ''}<div class="msg-content"><div class="bubble">${renderMarkdown(text)}</div></div>`;
  setupCodeBlocks(row); messagesEl.appendChild(row); messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function createAiRow(agent) {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  const initial = { gemini: 'G', nvidia: 'N' }[agent] || 'Q';
  row.innerHTML = `<div class="msg-avatar">${initial}</div><div class="msg-content"><div class="bubble"></div></div>`;
  messagesEl.appendChild(row); messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function appendTyping(msg) {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.innerHTML = `<div class="msg-avatar">..</div><div class="msg-content"><div class="typing-box"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div><span>${msg}</span></div></div>`;
  messagesEl.appendChild(row); messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function setupCodeBlocks(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.dataset.bound) return;
    pre.dataset.bound = 'true';
    const code = pre.querySelector('code');
    if (!code) return;
    if (typeof hljs !== 'undefined') hljs.highlightElement(code);
    const lang = Array.from(code.classList).find(c => c.startsWith('language-'))?.replace('language-', '') || 'code';
    const target = lang.includes('html') ? 'index.html' : lang.includes('css') ? 'style.css' : (lang.includes('js') ? 'script.js' : null);
    const box = document.createElement('div');
    box.className = 'code-box';
    box.innerHTML = `<div class="code-box-header"><div class="code-box-title"><span>${lang.toUpperCase()}</span>${target ? `<span class="code-auto-tag">✓ Auto-written to ${target}</span>` : ''}</div><div class="code-box-btns"><button class="code-btn apply-btn">${target ? `Re-apply to ${target}` : 'Apply to Editor'}</button><button class="code-btn copy-btn">Copy</button></div></div>`;
    box.querySelector('.copy-btn').onclick = e => copyText(code.innerText, e.currentTarget);
    box.querySelector('.apply-btn').onclick = () => {
      const dest = target || activeFile;
      files[dest] = code.innerText;
      const s = getCurrentSession(); if (s) { if (!s.files) s.files = {}; s.files[dest] = code.innerText; }
      saveAllSessions(); openFile(dest); setView('split'); setMode('code'); updatePreviewIframe(); showToast(`Applied to ${dest}`);
    };
    pre.parentNode.insertBefore(box, pre); box.appendChild(pre);
  });
}

// Events
function setupEvents() {
  enhancerToggleBtn.onclick = toggleEnhancer;
  $('viewSplitBtn').onclick = () => setView('split');
  $('viewChatBtn').onclick = () => setView('chat');
  modeCodeBtn.onclick = () => setMode('code');
  modePreviewBtn.onclick = runPreview;
  runPreviewBtn.onclick = runPreview;
  copyEditorCodeBtn.onclick = e => copyText(codeTextarea.value, e.currentTarget);
  clearEditorCodeBtn.onclick = clearEditorCode;
  if (newFileBtn) newFileBtn.onclick = createNewFile;
  if (resetFilesBtn) resetFilesBtn.onclick = resetWorkspaceFiles;
  if (openSettingsBtn) openSettingsBtn.onclick = openSettingsModal;
  if (sidebarSettingsBtn) sidebarSettingsBtn.onclick = () => { openSettingsModal(); closeSidebar(); };
  if (settingsCloseBtn) settingsCloseBtn.onclick = closeSettingsModal;
  if (settingsSaveBtn) settingsSaveBtn.onclick = saveSettings;
  if (settingsResetBtn) settingsResetBtn.onclick = resetSettingsToDefaults;
  if (settingsModalOverlay) settingsModalOverlay.onclick = e => { if (e.target === settingsModalOverlay) closeSettingsModal(); };
  [settingGroqKey, settingGeminiKey, settingNvidiaKey].forEach(inp => { if (inp) inp.oninput = updateKeyStatuses; });
  codeTextarea.oninput = () => { updateLines(); saveCurrentFileContent(); };
  codeTextarea.onscroll = () => { lineNumbers.scrollTop = codeTextarea.scrollTop; };
  codeTextarea.onkeydown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = codeTextarea.selectionStart;
      codeTextarea.value = codeTextarea.value.slice(0, s) + '  ' + codeTextarea.value.slice(codeTextarea.selectionEnd);
      codeTextarea.selectionStart = codeTextarea.selectionEnd = s + 2;
      updateLines(); saveCurrentFileContent();
    }
  };
  sendBtn.onclick = sendMessage;
  messageInput.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  messageInput.oninput = () => { updateSendBtn(); messageInput.style.height = 'auto'; messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px'; };
  clearChatBtn.onclick = clearChat;
  newChatBtn.onclick = startNewChat;
  deleteHistoryBtn.onclick = () => {
    if (!confirm('Clear all chat history and codespaces?')) return;
    sessions = [];
    try { ['cosmic_sessions','cosmic_active_session','cosmic_files'].forEach(k => localStorage.removeItem(k)); } catch (_) {}
    createNewSession(true); showToast('All history cleared');
  };
  hamburgerBtn.onclick = () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible'); };
  sidebarOverlay.onclick = closeSidebar;
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.onclick = () => { messageInput.value = chip.dataset.text; updateSendBtn(); sendMessage(); };
  });
}

function updateSendBtn() { sendBtn.disabled = !messageInput.value.trim() || isStreaming; }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('visible'); }
function copyText(text, btn) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => { const p = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = p, 1500); });
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000);
}

init();