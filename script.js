// ============================================================
// COSMIC AI — MINIMALIST IDE & 3-AGENT SYSTEM
// Concise Vanilla JavaScript (Groq, Gemini, NVIDIA)
// ============================================================

// API Credentials (loaded from .env/keys.json)
const KEYS = {
  groq: '',
  gemini: '',
  nvidia: ''
};

const SYSTEM_PROMPT = 'You are Cosmic AI, a software engineering assistant in a code IDE. Write clean, direct code with language markdown tags. Explain concisely without conversational filler.';

// State
let enhancerActive = false;
let isStreaming = false;
let activeFile = 'index.html';
let chatHistoryList = [];
let currentHistory = [];

const DEFAULT_FILES = {
  'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>Preview</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="box">
    <h1>Cosmic AI Studio</h1>
    <p>Live preview ready. Edit HTML, CSS, or JS and click Run Preview.</p>
    <button id="testBtn">Test Button</button>
  </div>
  <script src="script.js"><\/script>
</body>
</html>`,
  'style.css': `body {
  font-family: -apple-system, sans-serif;
  padding: 30px;
  background: #fafafa;
  color: #111;
  display: flex;
  justify-content: center;
}
.box {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
  max-width: 400px;
}
h1 { font-size: 20px; margin-top: 0; }
button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}`,
  'script.js': `document.getElementById('testBtn').addEventListener('click', function() {
  alert('Live Preview working!');
});`
};

let files = { ...DEFAULT_FILES };

// DOM Elements
const enhancerToggleBtn = document.getElementById('enhancerToggleBtn');
const enhancerBadge = document.getElementById('enhancerBadge');
const enhancerStatus = document.getElementById('enhancerStatus');
const agentSelect = document.getElementById('agentSelect');
const runPreviewBtn = document.getElementById('runPreviewBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const newChatBtn = document.getElementById('newChatBtn');
const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const workspaceGrid = document.getElementById('workspaceGrid');

const editorTabs = document.getElementById('editorTabs');
const sidebarFileList = document.getElementById('sidebarFileList');
const chatHistory = document.getElementById('chatHistory');
const modeCodeBtn = document.getElementById('modeCodeBtn');
const modePreviewBtn = document.getElementById('modePreviewBtn');
const copyEditorCodeBtn = document.getElementById('copyEditorCodeBtn');
const editorCodeView = document.getElementById('editorCodeView');
const editorPreviewView = document.getElementById('editorPreviewView');
const previewIframe = document.getElementById('previewIframe');
const lineNumbers = document.getElementById('lineNumbers');
const codeTextarea = document.getElementById('codeTextarea');
const statusFilename = document.getElementById('statusFilename');
const statusInfo = document.getElementById('statusInfo');

const messagesEl = document.getElementById('messages');
const welcomeEl = document.getElementById('welcome');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Marked setup
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang))
      ? hljs.highlight(code, { language: lang }).value
      : (typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code)
  });
}

// Init
async function init() {
  await loadEnvKeys();
  loadFilesFromStorage();
  loadHistoryFromStorage();
  setupEvents();
  renderFileTabs();
  renderSidebarFiles();
  openFile(activeFile);
}

async function loadEnvKeys() {
  try {
    const res = await fetch('.env/keys.json');
    if (res.ok) {
      const data = await res.json();
      if (data.GROQ_API_KEY) KEYS.groq = data.GROQ_API_KEY;
      if (data.GEMINI_API_KEY) KEYS.gemini = data.GEMINI_API_KEY;
      if (data.NVIDIA_API_KEY) KEYS.nvidia = data.NVIDIA_API_KEY;
    }
  } catch (_) {}
}

function loadFilesFromStorage() {
  try {
    const s = localStorage.getItem('cosmic_files');
    if (s) files = JSON.parse(s);
  } catch (_) {}
}

function saveFilesToStorage() {
  try { localStorage.setItem('cosmic_files', JSON.stringify(files)); } catch (_) {}
}

// Workspace File Operations
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
    item.textContent = name;
    item.onclick = () => { saveCurrentFileContent(); openFile(name); setView('split'); closeSidebar(); };
    sidebarFileList.appendChild(item);
  });
}

function openFile(name) {
  activeFile = name;
  codeTextarea.value = files[name] || '';
  statusFilename.textContent = name;
  updateLines();
  renderFileTabs();
  renderSidebarFiles();
}

function saveCurrentFileContent() {
  if (activeFile && files[activeFile] !== undefined) {
    files[activeFile] = codeTextarea.value;
    saveFilesToStorage();
  }
}

function updateLines() {
  const count = codeTextarea.value.split('\n').length;
  lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join('\n');
  statusInfo.textContent = `Lines: ${count} | UTF-8`;
}

function runPreview() {
  saveCurrentFileContent();
  const bundle = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${files['style.css'] || ''}</style></head><body>${(files['index.html'] || '').replace(/<link[^>]*>/gi, '').replace(/<script\s+src="[^"]*"[^>]*><\/script>/gi, '')}<script>${files['script.js'] || ''}<\/script></body></html>`;
  previewIframe.srcdoc = bundle;
  setMode('preview');
  if (workspaceGrid.classList.contains('mode-chat')) setView('split');
  showToast('Live preview updated');
}

function setMode(mode) {
  modeCodeBtn.classList.toggle('active', mode === 'code');
  modePreviewBtn.classList.toggle('active', mode === 'preview');
  editorCodeView.style.display = mode === 'code' ? 'flex' : 'none';
  editorPreviewView.style.display = mode === 'preview' ? 'flex' : 'none';
}

function setView(view) {
  document.getElementById('viewSplitBtn').classList.toggle('active', view === 'split');
  document.getElementById('viewEditorBtn').classList.toggle('active', view === 'editor');
  document.getElementById('viewChatBtn').classList.toggle('active', view === 'chat');

  workspaceGrid.classList.remove('mode-editor', 'mode-chat');
  if (view === 'editor') workspaceGrid.classList.add('mode-editor');
  if (view === 'chat') workspaceGrid.classList.add('mode-chat');
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
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are an expert prompt engineer. Expand the user prompt into a precise, high-level technical engineering specification for an AI developer. Return ONLY the enhanced prompt.' },
        { role: 'user', content: promptText }
      ]
    })
  });
  if (!res.ok) return promptText;
  const d = await res.json();
  return d.choices?.[0]?.message?.content?.trim() || promptText;
}

// Agent Calls
async function callAgent(agent, history, onChunk) {
  if (agent === 'gemini') {
    // Google Gemini 2.0 Flash
    const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${KEYS.gemini}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] } })
    });
    if (!res.ok) throw new Error(`Gemini error (${res.status})`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) { full += chunk; onChunk(full); }
        } catch (_) {}
      }
    }
    return full;

  } else if (agent === 'nvidia') {
    // NVIDIA NIM (Meta Llama 3.2 11B Vision)
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.nvidia}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        stream: true,
        max_tokens: 1500,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history]
      })
    });
    if (!res.ok) throw new Error(`NVIDIA error (${res.status})`);
    return await streamOpenAIResponse(res, onChunk);

  } else {
    // Groq Cloud (OpenAI OSS 120B)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        stream: true,
        max_tokens: 1500,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history]
      })
    });
    if (!res.ok) throw new Error(`Groq error (${res.status})`);
    return await streamOpenAIResponse(res, onChunk);
  }
}

async function streamOpenAIResponse(res, onChunk) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) { full += token; onChunk(full); }
      } catch (_) {}
    }
  }
  return full;
}

// Chat Sending
async function sendMessage() {
  const raw = messageInput.value.trim();
  if (!raw || isStreaming) return;

  welcomeEl.classList.add('hidden');
  messageInput.value = '';
  updateSendBtn();

  appendMessage('user', raw);

  let promptToSend = raw;
  let enhancedPrefix = '';

  if (enhancerActive) {
    const typing = appendTyping('Enhancing prompt with Groq...');
    try {
      const enhanced = await enhancePrompt(raw);
      promptToSend = enhanced;
      enhancedPrefix = `> [Enhanced Prompt Used - Groq]\n> ${enhanced.replace(/\n/g, '\n> ')}\n\n---\n\n`;
    } catch (_) {}
    typing.remove();
  }

  currentHistory.push({ role: 'user', content: promptToSend });
  const agent = agentSelect.value;
  const typing = appendTyping(`${agent.toUpperCase()} is writing...`);
  isStreaming = true;

  try {
    const aiRow = createAiRow(agent);
    const bubble = aiRow.querySelector('.bubble');
    typing.remove();

    let fullRes = '';
    await callAgent(agent, currentHistory, (chunk) => {
      fullRes = chunk;
      bubble.innerHTML = marked.parse(enhancedPrefix + fullRes);
      setupCodeBlocks(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    currentHistory.push({ role: 'assistant', content: fullRes });
    saveSession();
  } catch (err) {
    typing.remove();
    appendMessage('ai', `Error: ${err.message}`);
  }

  isStreaming = false;
  updateSendBtn();
}

// Message Rendering
function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `
    ${role === 'ai' ? '<div class="msg-avatar">AI</div>' : ''}
    <div class="msg-content"><div class="bubble">${marked.parse(text)}</div></div>`;
  setupCodeBlocks(row);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function createAiRow(agent) {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.innerHTML = `
    <div class="msg-avatar">${agent === 'gemini' ? 'G' : (agent === 'nvidia' ? 'N' : 'Q')}</div>
    <div class="msg-content"><div class="bubble"></div></div>`;
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function appendTyping(msg) {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.innerHTML = `<div class="msg-avatar">..</div><div class="msg-content"><div class="typing-box"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div><span>${msg}</span></div></div>`;
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function setupCodeBlocks(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.dataset.bound) return;
    pre.dataset.bound = 'true';

    const code = pre.querySelector('code');
    if (!code) return;
    hljs.highlightElement(code);

    const lang = Array.from(code.classList).find(c => c.startsWith('language-'))?.replace('language-', '') || 'code';

    const box = document.createElement('div');
    box.className = 'code-box';
    box.innerHTML = `
      <div class="code-box-header">
        <span>${lang.toUpperCase()}</span>
        <div class="code-box-btns">
          <button class="code-btn apply-btn">Apply to Editor</button>
          <button class="code-btn copy-btn">Copy</button>
        </div>
      </div>`;

    box.querySelector('.copy-btn').onclick = (e) => copyText(code.innerText, e.currentTarget);
    box.querySelector('.apply-btn').onclick = () => {
      let target = activeFile;
      if (lang.includes('html')) target = 'index.html';
      else if (lang.includes('css')) target = 'style.css';
      else if (lang.includes('js')) target = 'script.js';
      files[target] = code.innerText;
      saveFilesToStorage();
      openFile(target);
      setView('split');
      setMode('code');
      showToast(`Applied code to ${target}`);
    };

    pre.parentNode.insertBefore(box, pre);
    box.appendChild(pre);
  });
}

// Sessions & History
function saveSession() {
  if (!currentHistory.length) return;
  const title = currentHistory[0].content.slice(0, 28) + (currentHistory[0].content.length > 28 ? '...' : '');
  chatHistoryList.unshift({ title, history: [...currentHistory] });
  try { localStorage.setItem('cosmic_sessions', JSON.stringify(chatHistoryList.slice(0, 20))); } catch (_) {}
  renderHistory();
}

function loadHistoryFromStorage() {
  try {
    const s = localStorage.getItem('cosmic_sessions');
    if (s) chatHistoryList = JSON.parse(s);
  } catch (_) {}
  renderHistory();
}

function renderHistory() {
  chatHistory.innerHTML = '';
  chatHistoryList.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<span>${s.title}</span><button class="history-item-del">&times;</button>`;
    item.querySelector('.history-item-del').onclick = (e) => {
      e.stopPropagation();
      chatHistoryList.splice(idx, 1);
      try { localStorage.setItem('cosmic_sessions', JSON.stringify(chatHistoryList)); } catch (_) {}
      renderHistory();
    };
    item.onclick = () => {
      currentHistory = [...s.history];
      welcomeEl.classList.add('hidden');
      messagesEl.innerHTML = '';
      currentHistory.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.content));
      closeSidebar();
    };
    chatHistory.appendChild(item);
  });
}

function startNewChat() {
  currentHistory = [];
  messagesEl.innerHTML = '';
  messagesEl.appendChild(welcomeEl);
  welcomeEl.classList.remove('hidden');
  closeSidebar();
}

// Events
function setupEvents() {
  enhancerToggleBtn.onclick = toggleEnhancer;

  document.getElementById('viewSplitBtn').onclick = () => setView('split');
  document.getElementById('viewEditorBtn').onclick = () => setView('editor');
  document.getElementById('viewChatBtn').onclick = () => setView('chat');

  modeCodeBtn.onclick = () => setMode('code');
  modePreviewBtn.onclick = () => { runPreview(); setMode('preview'); };
  runPreviewBtn.onclick = runPreview;
  copyEditorCodeBtn.onclick = (e) => copyText(codeTextarea.value, e.currentTarget);

  codeTextarea.oninput = () => { updateLines(); saveCurrentFileContent(); };
  codeTextarea.onscroll = () => { lineNumbers.scrollTop = codeTextarea.scrollTop; };
  codeTextarea.onkeydown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = codeTextarea.selectionStart;
      codeTextarea.value = codeTextarea.value.slice(0, s) + '  ' + codeTextarea.value.slice(codeTextarea.selectionEnd);
      codeTextarea.selectionStart = codeTextarea.selectionEnd = s + 2;
      updateLines();
      saveCurrentFileContent();
    }
  };

  sendBtn.onclick = sendMessage;
  messageInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  messageInput.oninput = () => {
    updateSendBtn();
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  };

  clearChatBtn.onclick = () => {
    currentHistory = [];
    messagesEl.innerHTML = '';
    messagesEl.appendChild(welcomeEl);
    welcomeEl.classList.remove('hidden');
    showToast('Chat cleared');
  };

  newChatBtn.onclick = startNewChat;

  deleteHistoryBtn.onclick = () => {
    if (confirm('Clear all chat history?')) {
      chatHistoryList = [];
      try { localStorage.removeItem('cosmic_sessions'); } catch (_) {}
      renderHistory();
      startNewChat();
      showToast('History deleted');
    }
  };

  hamburgerBtn.onclick = () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible');
  };
  sidebarOverlay.onclick = closeSidebar;

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.onclick = () => {
      messageInput.value = chip.dataset.text;
      updateSendBtn();
      sendMessage();
    };
  });
}

function updateSendBtn() {
  sendBtn.disabled = !messageInput.value.trim() || isStreaming;
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
}

function copyText(text, btn) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => btn.textContent = prev, 1500);
  });
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

init();