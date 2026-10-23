// ============================================================
// COSMIC AI — MINIMALIST IDE & 3-AGENT SYSTEM
// Robust Vanilla JavaScript (Groq, Gemini, NVIDIA)
// ============================================================

// API Credentials (loaded from .env/keys.json or Settings)
const DEFAULT_KEYS = {
  groq: '',
  gemini: '',
  nvidia: ''
};

const KEYS = { ...DEFAULT_KEYS };

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

// Workspace Actions
const newFileBtn = document.getElementById('newFileBtn');
const resetFilesBtn = document.getElementById('resetFilesBtn');
const clearEditorCodeBtn = document.getElementById('clearEditorCodeBtn');

// Settings Elements
const openSettingsBtn = document.getElementById('openSettingsBtn');
const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const settingsSaveBtn = document.getElementById('settingsSaveBtn');
const settingsResetBtn = document.getElementById('settingsResetBtn');
const settingGroqKey = document.getElementById('settingGroqKey');
const settingGeminiKey = document.getElementById('settingGeminiKey');
const settingNvidiaKey = document.getElementById('settingNvidiaKey');
const statusGroqKey = document.getElementById('statusGroqKey');
const statusGeminiKey = document.getElementById('statusGeminiKey');
const statusNvidiaKey = document.getElementById('statusNvidiaKey');

// Editor Elements
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

// Chat Elements
const messagesEl = document.getElementById('messages');
const welcomeEl = document.getElementById('welcome');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Safe Markdown Parsing
function renderMarkdown(text) {
  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    try {
      return marked.parse(text);
    } catch (_) {
      return escapeHtml(text);
    }
  }
  return escapeHtml(text);
}

// Init Application
async function init() {
  loadStoredKeys();
  await loadEnvKeys();
  loadFilesFromStorage();
  loadHistoryFromStorage();
  setupEvents();
  renderFileTabs();
  renderSidebarFiles();
  openFile(activeFile);
}

// Credentials Management
function loadStoredKeys() {
  try {
    const s = localStorage.getItem('cosmic_keys');
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.groq) KEYS.groq = parsed.groq;
      if (parsed.gemini) KEYS.gemini = parsed.gemini;
      if (parsed.nvidia) KEYS.nvidia = parsed.nvidia;
    }
  } catch (_) {}
}

async function loadEnvKeys() {
  try {
    const res = await fetch('.env/keys.json');
    if (res.ok) {
      const data = await res.json();
      if (!localStorage.getItem('cosmic_keys')) {
        if (data.GROQ_API_KEY) KEYS.groq = data.GROQ_API_KEY;
        if (data.GEMINI_API_KEY) KEYS.gemini = data.GEMINI_API_KEY;
        if (data.NVIDIA_API_KEY) KEYS.nvidia = data.NVIDIA_API_KEY;
        try { localStorage.setItem('cosmic_keys', JSON.stringify(KEYS)); } catch (_) {}
      }
    }
  } catch (_) {}
}

function openSettingsModal() {
  settingGroqKey.value = KEYS.groq || '';
  settingGeminiKey.value = KEYS.gemini || '';
  settingNvidiaKey.value = KEYS.nvidia || '';
  updateKeyStatuses();
  settingsModalOverlay.classList.add('show');
}

function closeSettingsModal() {
  settingsModalOverlay.classList.remove('show');
}

function updateKeyStatuses() {
  if (statusGroqKey) {
    statusGroqKey.textContent = settingGroqKey.value.trim() ? 'Configured' : 'Missing';
    statusGroqKey.className = `form-status ${settingGroqKey.value.trim() ? 'ok' : 'missing'}`;
  }
  if (statusGeminiKey) {
    statusGeminiKey.textContent = settingGeminiKey.value.trim() ? 'Configured' : 'Missing';
    statusGeminiKey.className = `form-status ${settingGeminiKey.value.trim() ? 'ok' : 'missing'}`;
  }
  if (statusNvidiaKey) {
    statusNvidiaKey.textContent = settingNvidiaKey.value.trim() ? 'Configured' : 'Missing';
    statusNvidiaKey.className = `form-status ${settingNvidiaKey.value.trim() ? 'ok' : 'missing'}`;
  }
}

function saveSettings() {
  KEYS.groq = settingGroqKey.value.trim();
  KEYS.gemini = settingGeminiKey.value.trim();
  KEYS.nvidia = settingNvidiaKey.value.trim();
  try {
    localStorage.setItem('cosmic_keys', JSON.stringify(KEYS));
  } catch (_) {}
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

// Workspace File Operations
function loadFilesFromStorage() {
  try {
    const s = localStorage.getItem('cosmic_files');
    if (s) {
      const parsed = JSON.parse(s);
      if (Object.keys(parsed).length > 0) files = parsed;
    }
  } catch (_) {}
}

function saveFilesToStorage() {
  try { localStorage.setItem('cosmic_files', JSON.stringify(files)); } catch (_) {}
}

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
  const fileNames = Object.keys(files);
  fileNames.forEach(name => {
    const item = document.createElement('div');
    item.className = `file-item${name === activeFile ? ' active' : ''}`;
    
    const label = document.createElement('span');
    label.textContent = name;
    item.appendChild(label);

    // Delete button for custom files (or if there are multiple files)
    if (fileNames.length > 1 && !['index.html', 'style.css', 'script.js'].includes(name)) {
      const delBtn = document.createElement('button');
      delBtn.className = 'file-item-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = `Delete ${name}`;
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteFile(name);
      };
      item.appendChild(delBtn);
    }

    item.onclick = () => {
      saveCurrentFileContent();
      openFile(name);
      setView('split');
      closeSidebar();
    };
    sidebarFileList.appendChild(item);
  });
}

function openFile(name) {
  if (!files[name] && files[name] !== '') {
    name = Object.keys(files)[0] || 'index.html';
  }
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

function createNewFile() {
  const rawName = prompt('Enter new file name (e.g., utils.js, component.html):');
  if (!rawName) return;
  const fileName = rawName.trim();
  if (!fileName) return;

  if (files[fileName] !== undefined) {
    saveCurrentFileContent();
    openFile(fileName);
    showToast(`Switched to existing file: ${fileName}`);
    return;
  }

  saveCurrentFileContent();
  files[fileName] = '';
  saveFilesToStorage();
  openFile(fileName);
  showToast(`Created ${fileName}`);
}

function deleteFile(name) {
  if (!confirm(`Delete ${name}?`)) return;
  delete files[name];
  saveFilesToStorage();
  if (activeFile === name) {
    activeFile = Object.keys(files)[0] || 'index.html';
  }
  openFile(activeFile);
  showToast(`Deleted ${name}`);
}

function resetWorkspaceFiles() {
  if (!confirm('Reset all files (index.html, style.css, script.js) to clean starter templates?')) return;
  files = { ...DEFAULT_FILES };
  saveFilesToStorage();
  openFile('index.html');
  showToast('Workspace reset to starter project');
}

function clearEditorCode() {
  if (!confirm(`Clear all code in ${activeFile}?`)) return;
  codeTextarea.value = '';
  saveCurrentFileContent();
  updateLines();
  showToast(`Cleared ${activeFile}`);
}

function runPreview() {
  saveCurrentFileContent();
  const htmlContent = (files['index.html'] || '')
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script\s+src=["'][^"']*["'][^>]*><\/script>/gi, '');
  const bundle = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${files['style.css'] || ''}</style></head><body>${htmlContent}<script>${files['script.js'] || ''}<\/script></body></html>`;
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
  const splitBtn = document.getElementById('viewSplitBtn');
  const chatBtn = document.getElementById('viewChatBtn');
  if (splitBtn) splitBtn.classList.toggle('active', view === 'split');
  if (chatBtn) chatBtn.classList.toggle('active', view === 'chat');

  workspaceGrid.classList.remove('mode-editor', 'mode-chat');
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
  if (!KEYS.groq) return promptText;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You are an expert prompt engineer. Expand the user prompt into a concise, high-level technical engineering specification for an AI developer. Return ONLY the enhanced prompt.' },
          { role: 'user', content: promptText }
        ]
      })
    });
    if (!res.ok) return promptText;
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() || promptText;
  } catch (_) {
    return promptText;
  }
}

// Agent Calls
function getAgentName(agent) {
  if (agent === 'gemini') return 'Gemini';
  if (agent === 'groq-fast') return 'Groq Fast';
  if (agent === 'nvidia') return 'NVIDIA';
  return 'Groq';
}

async function callAgent(agent, history, onChunk, onReasoning) {
  if (agent === 'gemini') {
    // Google Gemini 2.5 Flash
    if (!KEYS.gemini) {
      openSettingsModal();
      throw new Error('Gemini API Key missing. Please configure it in Settings.');
    }
    const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${KEYS.gemini}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Gemini error (${res.status})`;
      try {
        const j = JSON.parse(errText);
        if (j.error?.message) msg = j.error.message;
      } catch (_) {}
      throw new Error(msg);
    }

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
          const parts = parsed.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.text) {
              full += p.text;
              onChunk(full);
            }
          }
        } catch (_) {}
      }
    }
    return full;

  } else if (agent === 'nvidia') {
    // NVIDIA NIM (Meta Llama 3.2 11B Vision Instruct)
    if (!KEYS.nvidia) {
      openSettingsModal();
      throw new Error('NVIDIA API Key missing. Please configure it in Settings.');
    }
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

    if (!res.ok) {
      const errText = await res.text();
      let msg = `NVIDIA error (${res.status})`;
      try {
        const j = JSON.parse(errText);
        if (j.detail) msg = j.detail;
        else if (j.title) msg = j.title;
      } catch (_) {}
      throw new Error(msg);
    }
    return await streamOpenAIResponse(res, onChunk, onReasoning);

  } else if (agent === 'groq-fast') {
    // Groq Cloud (Qwen 2.5 27B - Instant code responses)
    if (!KEYS.groq) {
      openSettingsModal();
      throw new Error('Groq API Key missing. Please configure it in Settings.');
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        stream: true,
        max_tokens: 2000,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Groq error (${res.status})`;
      try {
        const j = JSON.parse(errText);
        if (j.error?.message) msg = j.error.message;
      } catch (_) {}
      throw new Error(msg);
    }
    return await streamOpenAIResponse(res, onChunk, onReasoning);

  } else {
    // Groq Cloud (OpenAI OSS 120B with Deep Reasoning)
    if (!KEYS.groq) {
      openSettingsModal();
      throw new Error('Groq API Key missing. Please configure it in Settings.');
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        stream: true,
        max_tokens: 2500,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Groq error (${res.status})`;
      try {
        const j = JSON.parse(errText);
        if (j.error?.message) msg = j.error.message;
      } catch (_) {}
      throw new Error(msg);
    }
    return await streamOpenAIResponse(res, onChunk, onReasoning);
  }
}

async function streamOpenAIResponse(res, onChunk, onReasoning) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let reasoning = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.reasoning && onReasoning) {
          reasoning += delta.reasoning;
          onReasoning(reasoning);
        }
        if (delta.content) {
          full += delta.content;
          onChunk(full);
        }
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
  messageInput.style.height = 'auto';
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
  const typing = appendTyping(`${getAgentName(agent)} is writing...`);
  isStreaming = true;

  try {
    const aiRow = createAiRow(agent);
    const bubble = aiRow.querySelector('.bubble');
    typing.remove();

    let fullRes = '';
    let reasoningText = '';

    await callAgent(
      agent,
      currentHistory,
      (chunk) => {
        fullRes = chunk;
        renderAiBubble(bubble, enhancedPrefix + fullRes, reasoningText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      (rChunk) => {
        reasoningText = rChunk;
        renderAiBubble(bubble, enhancedPrefix + fullRes, reasoningText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    );

    currentHistory.push({ role: 'assistant', content: fullRes });
    saveSession();
  } catch (err) {
    typing.remove();
    appendMessage('ai', `**Agent Error (${getAgentName(agent)}):** ${err.message}\n\n*Check your API credentials in Settings if needed.*`);
  }

  isStreaming = false;
  updateSendBtn();
}

function renderAiBubble(bubble, markdownText, reasoningText) {
  let html = '';
  if (reasoningText) {
    html += `<div class="thinking-box">
      <div class="thinking-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <span>Thinking (${reasoningText.length} chars)</span>
        <span style="font-size:10px;">toggle</span>
      </div>
      <div class="thinking-content">${escapeHtml(reasoningText)}</div>
    </div>`;
  }
  html += renderMarkdown(markdownText);
  bubble.innerHTML = html;
  setupCodeBlocks(bubble);
}

// Message Rendering
function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `
    ${role === 'ai' ? '<div class="msg-avatar">AI</div>' : ''}
    <div class="msg-content"><div class="bubble">${renderMarkdown(text)}</div></div>`;
  setupCodeBlocks(row);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function createAiRow(agent) {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  const initial = agent === 'gemini' ? 'G' : (agent === 'nvidia' ? 'N' : 'Q');
  row.innerHTML = `
    <div class="msg-avatar">${initial}</div>
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
    if (typeof hljs !== 'undefined') hljs.highlightElement(code);

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
    item.innerHTML = `<span>${escapeHtml(s.title)}</span><button class="history-item-del" title="Delete conversation">&times;</button>`;
    
    item.querySelector('.history-item-del').onclick = (e) => {
      e.stopPropagation();
      chatHistoryList.splice(idx, 1);
      try { localStorage.setItem('cosmic_sessions', JSON.stringify(chatHistoryList)); } catch (_) {}
      renderHistory();
    };

    item.onclick = () => {
      currentHistory = [...s.history];
      welcomeEl.classList.add('hidden');
      // Clear message rows
      messagesEl.querySelectorAll('.message-row').forEach(r => r.remove());
      currentHistory.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.content));
      closeSidebar();
    };
    chatHistory.appendChild(item);
  });
}

// New Chat & Clear Chat Handlers
function startNewChat() {
  currentHistory = [];
  messagesEl.querySelectorAll('.message-row').forEach(r => r.remove());
  welcomeEl.classList.remove('hidden');
  messageInput.value = '';
  messageInput.style.height = 'auto';
  updateSendBtn();
  closeSidebar();
  showToast('Started new chat');
}

function clearChat() {
  currentHistory = [];
  messagesEl.querySelectorAll('.message-row').forEach(r => r.remove());
  welcomeEl.classList.remove('hidden');
  messageInput.value = '';
  messageInput.style.height = 'auto';
  updateSendBtn();
  showToast('Chat cleared');
}

// Event Listeners
function setupEvents() {
  enhancerToggleBtn.onclick = toggleEnhancer;

  document.getElementById('viewSplitBtn').onclick = () => setView('split');
  document.getElementById('viewChatBtn').onclick = () => setView('chat');

  modeCodeBtn.onclick = () => setMode('code');
  modePreviewBtn.onclick = () => { runPreview(); setMode('preview'); };
  runPreviewBtn.onclick = runPreview;
  copyEditorCodeBtn.onclick = (e) => copyText(codeTextarea.value, e.currentTarget);
  clearEditorCodeBtn.onclick = clearEditorCode;

  // Workspace Actions
  if (newFileBtn) newFileBtn.onclick = createNewFile;
  if (resetFilesBtn) resetFilesBtn.onclick = resetWorkspaceFiles;

  // Settings Actions
  if (openSettingsBtn) openSettingsBtn.onclick = openSettingsModal;
  if (sidebarSettingsBtn) sidebarSettingsBtn.onclick = () => { openSettingsModal(); closeSidebar(); };
  if (settingsCloseBtn) settingsCloseBtn.onclick = closeSettingsModal;
  if (settingsSaveBtn) settingsSaveBtn.onclick = saveSettings;
  if (settingsResetBtn) settingsResetBtn.onclick = resetSettingsToDefaults;
  if (settingsModalOverlay) {
    settingsModalOverlay.onclick = (e) => {
      if (e.target === settingsModalOverlay) closeSettingsModal();
    };
  }
  [settingGroqKey, settingGeminiKey, settingNvidiaKey].forEach(inp => {
    if (inp) inp.oninput = updateKeyStatuses;
  });

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

  clearChatBtn.onclick = clearChat;
  newChatBtn.onclick = startNewChat;

  deleteHistoryBtn.onclick = () => {
    if (confirm('Clear all chat history?')) {
      chatHistoryList = [];
      try { localStorage.removeItem('cosmic_sessions'); } catch (_) {}
      renderHistory();
      startNewChat();
      showToast('All chat history deleted');
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// Start application
init();