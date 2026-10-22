// ============================================================
// COSMIC STUDIO IDE — CORE JAVASCRIPT
// Supports 3 Agents (Groq, Gemini, NVIDIA), Prompt Enhancer,
// and Live Code Workspace IDE
// ============================================================

// Default API Keys & Endpoints (keys stored securely in localStorage via Settings)
const DEFAULT_GROQ_KEY = '';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const HORDE_API = 'https://stablehorde.net/api/v2';

const SYSTEM_PROMPT = `You are Cosmic Studio AI, an expert software engineer and pair-programmer in a code IDE.
- Provide clean, production-grade code, explanations, and debugging help.
- Format all code with markdown language tags (e.g., \`\`\`html, \`\`\`css, \`\`\`javascript).
- Be concise, helpful, and direct.`;

// DOM Elements: Topbar & Enhancer
const enhancerToggleBtn = document.getElementById('enhancerToggleBtn');
const enhancerBadge = document.getElementById('enhancerBadge');
const enhancerStatusPill = document.getElementById('enhancerStatusPill');
const viewSplitBtn = document.getElementById('viewSplitBtn');
const viewEditorBtn = document.getElementById('viewEditorBtn');
const viewChatBtn = document.getElementById('viewChatBtn');
const runPreviewBtn = document.getElementById('runPreviewBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');

// DOM Elements: Workspace & Editor
const workspaceGrid = document.getElementById('workspaceGrid');
const editorPane = document.getElementById('editorPane');
const chatPane = document.getElementById('chatPane');
const editorTabs = document.getElementById('editorTabs');
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
const sidebarFileList = document.getElementById('sidebarFileList');
const addFileBtn = document.getElementById('addFileBtn');

// DOM Elements: Chat & Input
const messagesEl = document.getElementById('messages');
const welcomeEl = document.getElementById('welcome');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const agentSelect = document.getElementById('agentSelect');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const filePreviewArea = document.getElementById('filePreviewArea');
const imggenBtn = document.getElementById('imggenBtn');
const micBtn = document.getElementById('micBtn');
const inputHint = document.getElementById('inputHint');

// DOM Elements: Sidebar & Modals
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');

const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const settingsSaveBtn = document.getElementById('settingsSaveBtn');
const settingGroqKey = document.getElementById('settingGroqKey');
const settingGeminiKey = document.getElementById('settingGeminiKey');
const settingNvidiaKey = document.getElementById('settingNvidiaKey');

const modalOverlay = document.getElementById('modalOverlay');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// Application State
let promptEnhancerActive = false;
let isStreaming = false;
let currentSessionId = null;
let conversationHistory = [];
let chatSessions = [];
let pendingFiles = [];
let pinnedMessages = [];
let activeFileName = 'index.html';
let micRecording = false;
let speechRecognition = null;

// Default Starter Workspace Files
const DEFAULT_FILES = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <h1>Cosmic Studio IDE</h1>
    <p>Edit HTML, CSS, or JS and click <strong>Run Preview</strong> to test live.</p>
    <button id="demoBtn">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #fafafa;
  color: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.card {
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  text-align: center;
  max-width: 400px;
}

h1 {
  margin-top: 0;
  font-size: 22px;
}

p {
  color: #666666;
  font-size: 14px;
  line-height: 1.5;
}

button {
  margin-top: 12px;
  padding: 8px 18px;
  background: #111111;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

button:hover {
  background: #333333;
}`,
  'script.js': `document.getElementById('demoBtn').addEventListener('click', function() {
  alert('Hello from your Cosmic Studio IDE Live Preview!');
});`
};

let workspaceFiles = {};

// Marked.js Configuration
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
      if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (_) {}
      }
      return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
    }
  });
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  loadWorkspaceFiles();
  loadApiKeys();
  loadSessionsFromStorage();
  startNewSession();
  setupEventListeners();
  initSpeechRecognition();
  refreshSuggestions();
  updateEditorFile(activeFileName);
}

// ============================================================
// WORKSPACE & CODE EDITOR LOGIC
// ============================================================
function loadWorkspaceFiles() {
  try {
    const saved = localStorage.getItem('cosmic_ide_files');
    if (saved) {
      workspaceFiles = JSON.parse(saved);
    } else {
      workspaceFiles = { ...DEFAULT_FILES };
    }
  } catch (_) {
    workspaceFiles = { ...DEFAULT_FILES };
  }
  renderFileTabs();
  renderSidebarFileList();
}

function saveWorkspaceFiles() {
  try {
    localStorage.setItem('cosmic_ide_files', JSON.stringify(workspaceFiles));
  } catch (_) {}
}

function renderFileTabs() {
  editorTabs.innerHTML = '';
  Object.keys(workspaceFiles).forEach(fileName => {
    const tab = document.createElement('div');
    tab.className = `editor-tab${fileName === activeFileName ? ' active' : ''}`;
    tab.textContent = fileName;
    tab.addEventListener('click', () => {
      saveActiveEditorContent();
      updateEditorFile(fileName);
    });
    editorTabs.appendChild(tab);
  });
}

function renderSidebarFileList() {
  sidebarFileList.innerHTML = '';
  Object.keys(workspaceFiles).forEach(fileName => {
    const item = document.createElement('div');
    item.className = `file-list-item${fileName === activeFileName ? ' active' : ''}`;
    item.innerHTML = `<span>📄</span> <span>${fileName}</span>`;
    item.addEventListener('click', () => {
      saveActiveEditorContent();
      updateEditorFile(fileName);
      switchViewMode('split');
      closeSidebar();
    });
    sidebarFileList.appendChild(item);
  });
}

function updateEditorFile(fileName) {
  if (!workspaceFiles[fileName]) {
    fileName = Object.keys(workspaceFiles)[0] || 'index.html';
  }
  activeFileName = fileName;
  codeTextarea.value = workspaceFiles[activeFileName] || '';
  statusFilename.textContent = activeFileName;
  updateLineNumbers();
  renderFileTabs();
  renderSidebarFileList();
}

function saveActiveEditorContent() {
  if (activeFileName && workspaceFiles[activeFileName] !== undefined) {
    workspaceFiles[activeFileName] = codeTextarea.value;
    saveWorkspaceFiles();
  }
}

function updateLineNumbers() {
  const lines = codeTextarea.value.split('\n').length;
  const numbersArr = [];
  for (let i = 1; i <= Math.max(lines, 1); i++) {
    numbersArr.push(i);
  }
  lineNumbers.textContent = numbersArr.join('\n');
  statusInfo.textContent = `Lines: ${lines} | UTF-8`;
}

function runLivePreview() {
  saveActiveEditorContent();
  const html = workspaceFiles['index.html'] || '';
  const css = workspaceFiles['style.css'] || '';
  const js = workspaceFiles['script.js'] || '';

  // Inlined complete HTML bundle
  const bundle = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${html.replace(/<link\s+rel="stylesheet"[^>]*>/gi, '').replace(/<script\s+src="[^"]*"[^>]*><\/script>/gi, '')}
  <script>
    try {
      ${js}
    } catch(err) {
      console.error("Preview Script Error:", err);
    }
  <\/script>
</body>
</html>`;

  previewIframe.srcdoc = bundle;
  setEditorMode('preview');
  if (workspaceGrid.classList.contains('mode-chat')) {
    switchViewMode('split');
  }
  showToast('Live preview updated');
}

function setEditorMode(mode) {
  if (mode === 'code') {
    modeCodeBtn.classList.add('active');
    modePreviewBtn.classList.remove('active');
    editorCodeView.style.display = 'flex';
    editorPreviewView.style.display = 'none';
  } else {
    modePreviewBtn.classList.add('active');
    modeCodeBtn.classList.remove('active');
    editorCodeView.style.display = 'none';
    editorPreviewView.style.display = 'flex';
  }
}

function switchViewMode(mode) {
  viewSplitBtn.classList.toggle('active', mode === 'split');
  viewEditorBtn.classList.toggle('active', mode === 'editor');
  viewChatBtn.classList.toggle('active', mode === 'chat');

  workspaceGrid.classList.remove('mode-editor', 'mode-chat');
  if (mode === 'editor') workspaceGrid.classList.add('mode-editor');
  if (mode === 'chat') workspaceGrid.classList.add('mode-chat');
}

// ============================================================
// PROMPT ENHANCER (GROQ CLOUD AI)
// ============================================================
function togglePromptEnhancer() {
  promptEnhancerActive = !promptEnhancerActive;
  if (promptEnhancerActive) {
    enhancerToggleBtn.classList.add('active');
    enhancerBadge.textContent = 'ON';
    enhancerBadge.classList.remove('off');
    enhancerStatusPill.textContent = '✨ Enhancer: ACTIVE (Groq)';
    enhancerStatusPill.classList.add('active');
    showToast('✨ Prompt Enhancer activated (Groq AI)');
  } else {
    enhancerToggleBtn.classList.remove('active');
    enhancerBadge.textContent = 'OFF';
    enhancerBadge.classList.add('off');
    enhancerStatusPill.textContent = '✨ Enhancer: OFF';
    enhancerStatusPill.classList.remove('active');
    showToast('Prompt Enhancer disabled');
  }
}

async function enhancePromptWithGroq(userPrompt) {
  const groqKey = getApiKey('groq');
  if (!groqKey) {
    openSettingsModal();
    throw new Error('Please enter your Groq API Key in Settings (free at console.groq.com) to use Prompt Enhancer.');
  }
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are an elite prompt engineer. Analyze the user prompt and re-engineer it into an advanced, highly technical, clear, and comprehensive specification prompt for an expert AI software developer. Return ONLY the enhanced prompt string without preamble, labels, or quotes.'
        },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Prompt enhancement failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  const enhanced = data.choices?.[0]?.message?.content?.trim();
  return enhanced || userPrompt;
}

// ============================================================
// AGENT DISPATCHER: GROQ, GEMINI, NVIDIA
// ============================================================
async function callSelectedAgent(agentType, messagesToSend, onChunk) {
  if (agentType === 'gemini') {
    return await callGeminiAgent(messagesToSend, onChunk);
  } else if (agentType === 'nvidia') {
    return await callNvidiaAgent(messagesToSend, onChunk);
  } else {
    return await callGroqAgent(messagesToSend, onChunk);
  }
}

// 1. Groq Agent
async function callGroqAgent(messagesToSend, onChunk) {
  const groqKey = getApiKey('groq');
  if (!groqKey) {
    openSettingsModal();
    throw new Error('Please enter your Groq API Key in Settings (free at console.groq.com) to use Groq.');
  }
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      stream: true,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messagesToSend]
    })
  });

  if (!response.ok) {
    let msg = `Groq HTTP ${response.status}`;
    try { const d = await response.json(); msg = d.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  let fullText = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          fullText += token;
          onChunk(fullText);
        }
      } catch (_) {}
    }
  }
  return fullText;
}

// 2. Google Gemini Agent
async function callGeminiAgent(messagesToSend, onChunk) {
  const geminiKey = getApiKey('gemini');
  if (!geminiKey) {
    openSettingsModal();
    throw new Error('Please enter your Google Gemini API Key in Settings to use the Gemini agent.');
  }

  // Convert conversation to Gemini contents format
  const contents = messagesToSend.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    })
  });

  if (!response.ok) {
    let msg = `Gemini HTTP ${response.status}`;
    try { const d = await response.json(); msg = d.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  let fullText = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textChunk) {
          fullText += textChunk;
          onChunk(fullText);
        }
      } catch (_) {}
    }
  }
  return fullText;
}

// 3. NVIDIA NIM Agent
async function callNvidiaAgent(messagesToSend, onChunk) {
  const nvidiaKey = getApiKey('nvidia');
  if (!nvidiaKey) {
    openSettingsModal();
    throw new Error('Please enter your NVIDIA NIM API Key in Settings to use the NVIDIA agent.');
  }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${nvidiaKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      stream: true,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messagesToSend]
    })
  });

  if (!response.ok) {
    let msg = `NVIDIA HTTP ${response.status}`;
    try { const d = await response.json(); msg = d.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  let fullText = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          fullText += token;
          onChunk(fullText);
        }
      } catch (_) {}
    }
  }
  return fullText;
}

// ============================================================
// CHAT & MESSAGE SENDING
// ============================================================
async function sendMessage() {
  const rawText = messageInput.value.trim();
  if ((!rawText && pendingFiles.length === 0) || isStreaming) return;

  welcomeEl.classList.add('hidden');

  const filesToSend = [...pendingFiles];
  pendingFiles = [];
  filePreviewArea.innerHTML = '';
  messageInput.value = '';
  messageInput.style.height = 'auto';
  updateSendBtn();

  await appendUserMessage(rawText, filesToSend);

  // Check if it's an image request
  if (rawText && isImageRequest(rawText)) {
    conversationHistory.push({ role: 'user', content: rawText });
    await handleImageGeneration(rawText);
    isStreaming = false;
    updateSendBtn();
    return;
  }

  const selectedAgent = agentSelect.value;
  let promptToUse = rawText;
  let enhancedPrefix = '';

  // Prompt Enhancement Step
  if (promptEnhancerActive && rawText) {
    const statusRow = appendTypingIndicator('Enhancing prompt with Groq Cloud AI...');
    try {
      const enhanced = await enhancePromptWithGroq(rawText);
      promptToUse = enhanced;
      enhancedPrefix = `> ✨ **Prompt Enhanced via Groq:**\n>\n> *${escapeHtml(enhanced).replace(/\n/g, '\n> ')}*\n\n---\n\n`;
    } catch (err) {
      console.warn('Enhancer failed, using original prompt:', err);
    } finally {
      statusRow.remove();
    }
  }

  // Prepare context with files and active editor file context
  let finalPrompt = promptToUse;
  if (filesToSend.length > 0) {
    const names = filesToSend.map(f => f.file.name).join(', ');
    finalPrompt += `\n\n[Attached files: ${names}]`;
  }

  // Include current active file snippet for IDE context if relevant
  finalPrompt += `\n\n[Active IDE File: ${activeFileName}]`;

  conversationHistory.push({ role: 'user', content: finalPrompt });

  const typingRow = appendTypingIndicator(`Agent (${selectedAgent.toUpperCase()}) is writing...`);
  isStreaming = true;

  try {
    const aiRow = createAiMessageRow(selectedAgent);
    const bubbleEl = aiRow.querySelector('.bubble');

    let agentResponseText = '';
    typingRow.remove();

    await callSelectedAgent(selectedAgent, conversationHistory, currentText => {
      agentResponseText = currentText;
      const combinedMarkdown = enhancedPrefix + agentResponseText;
      bubbleEl.innerHTML = marked.parse(combinedMarkdown);
      attachCodeBlockFeatures(bubbleEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    conversationHistory.push({ role: 'assistant', content: agentResponseText });
    saveCurrentSession();

  } catch (error) {
    typingRow.remove();
    appendMessage('ai', `**Agent Error (${selectedAgent.toUpperCase()}):** ${error.message}\n\nPlease check your API keys in Settings.`);
  }

  isStreaming = false;
  updateSendBtn();
}

// Code Blocks: Add "Copy" and "Apply to Editor" buttons
function attachCodeBlockFeatures(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = 'true';

    const codeEl = pre.querySelector('code');
    if (!codeEl) return;
    hljs.highlightElement(codeEl);

    // Determine language
    const langClass = Array.from(codeEl.classList).find(c => c.startsWith('language-')) || '';
    const lang = langClass.replace('language-', '') || 'code';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <span>${lang.toUpperCase()}</span>
      <div class="code-block-actions">
        <button class="code-btn apply-btn">Apply to Editor</button>
        <button class="code-btn copy-btn">Copy</button>
      </div>`;

    header.querySelector('.copy-btn').addEventListener('click', () => {
      copyText(codeEl.innerText, header.querySelector('.copy-btn'));
    });

    header.querySelector('.apply-btn').addEventListener('click', () => {
      applyCodeToEditor(codeEl.innerText, lang);
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function applyCodeToEditor(code, lang) {
  // Try to match target file by language
  let targetFile = activeFileName;
  if (lang.includes('html')) targetFile = 'index.html';
  else if (lang.includes('css')) targetFile = 'style.css';
  else if (lang.includes('js') || lang.includes('javascript')) targetFile = 'script.js';

  workspaceFiles[targetFile] = code;
  saveWorkspaceFiles();
  updateEditorFile(targetFile);
  switchViewMode('split');
  setEditorMode('code');
  showToast(`Applied code to ${targetFile}!`);
}

// ============================================================
// IMAGE GENERATION HANDLING
// ============================================================
function isImageRequest(text) {
  const clean = text.trim().toLowerCase();
  return /^(generate|create|draw|make|render|imagine)\s+(an?\s+)?(image|picture|photo|art|artwork)/i.test(clean) ||
         /^image\s+of\s+/i.test(clean);
}

function extractImagePrompt(text) {
  return text
    .replace(/^(generate|create|draw|make|render|imagine)\s+(an?\s+)?(image|picture|photo|art|artwork)\s*(of|showing|depicting)?/i, '')
    .replace(/^image\s+of\s+/i, '')
    .trim() || text;
}

async function generateHordeImage(prompt) {
  const submitRes = await fetch(`${HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '0000000000',
      'Client-Agent': 'CosmicAI:1.0:localhost'
    },
    body: JSON.stringify({
      prompt: prompt,
      params: { width: 512, height: 512, steps: 20, cfg_scale: 7, sampler_name: 'k_euler_a', n: 1 },
      models: ['stable_diffusion'],
      r2: true,
      shared: false
    })
  });

  if (!submitRes.ok) throw new Error(`Submission failed (HTTP ${submitRes.status})`);
  const { id } = await submitRes.json();
  if (!id) throw new Error('No task ID received');

  for (let i = 0; i < 40; i++) {
    await new Promise(res => setTimeout(res, 2500));
    const checkRes = await fetch(`${HORDE_API}/generate/check/${id}`, {
      headers: { 'Client-Agent': 'CosmicAI:1.0:localhost' }
    });
    const check = await checkRes.json();
    if (check.done) {
      const statusRes = await fetch(`${HORDE_API}/generate/status/${id}`, {
        headers: { 'Client-Agent': 'CosmicAI:1.0:localhost' }
      });
      const status = await statusRes.json();
      const imgUrl = status.generations?.[0]?.img;
      if (!imgUrl) throw new Error('Image not found in response');
      return imgUrl;
    }
    if (check.faulted) throw new Error('Generation server error');
  }
  throw new Error('Image generation timed out');
}

async function handleImageGeneration(rawText) {
  const prompt = extractImagePrompt(rawText);
  const fullPrompt = `${prompt}, minimalist, high quality, sharp detail`;

  const loadingRow = document.createElement('div');
  loadingRow.className = 'message-row ai';
  loadingRow.innerHTML = `
    <div class="ai-avatar">🎨</div>
    <div class="message-content">
      <div class="imggen-loading">
        <div class="imggen-spinner"></div>
        <span class="imggen-loading-text">Generating image: "${escapeHtml(prompt)}"...</span>
      </div>
    </div>`;
  messagesEl.appendChild(loadingRow);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const imageUrl = await generateHordeImage(fullPrompt);
    loadingRow.remove();

    const time = formatTime(new Date());
    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.innerHTML = `
      <div class="ai-avatar">🎨</div>
      <div class="message-content">
        <div class="bubble">
          <div class="gen-image-wrap">
            <img class="gen-image" src="${imageUrl}" alt="${escapeHtml(prompt)}" />
            <p class="gen-image-caption">"${escapeHtml(prompt)}"</p>
          </div>
        </div>
        <div class="message-meta">
          <span class="timestamp">${time}</span>
          <a class="copy-btn" href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
            Open Full Size
          </a>
        </div>
      </div>`;
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    conversationHistory.push({ role: 'assistant', content: `Generated image: "${prompt}"` });
    saveCurrentSession();

  } catch (error) {
    loadingRow.remove();
    appendMessage('ai', `**Image generation failed:** ${error.message}\n\nPlease try again with a simpler prompt.`);
  }
}

// ============================================================
// MESSAGE RENDERING HELPERS
// ============================================================
async function appendUserMessage(text, files) {
  const row = document.createElement('div');
  row.className = 'message-row user';
  const msgId = 'msg-' + Date.now();
  row.dataset.id = msgId;

  const time = formatTime(new Date());
  const content = document.createElement('div');
  content.className = 'message-content';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  for (const f of files) {
    if (f.file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.className = 'attached-img';
      await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; resolve(); };
        reader.readAsDataURL(f.file);
      });
      bubble.appendChild(img);
    } else {
      const label = document.createElement('div');
      label.className = 'attached-file-label';
      label.textContent = `📎 ${f.file.name}`;
      bubble.appendChild(label);
    }
  }

  if (text) {
    const textNode = document.createElement('span');
    textNode.textContent = text;
    bubble.appendChild(textNode);
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.innerHTML = `
    <span class="timestamp">${time}</span>
    <button class="copy-btn">Copy</button>
    <button class="pin-btn" data-id="${msgId}">Pin</button>`;

  meta.querySelector('.copy-btn').addEventListener('click', e => copyText(text, e.currentTarget));
  meta.querySelector('.pin-btn').addEventListener('click', e => togglePinMessage(msgId, 'user', text, e.currentTarget, row));

  content.appendChild(bubble);
  content.appendChild(meta);
  row.appendChild(content);

  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessage(role, content) {
  const msgId = 'msg-' + Date.now();
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.dataset.id = msgId;

  const time = formatTime(new Date());
  const formattedHtml = role === 'ai' ? marked.parse(content) : escapeHtml(content);

  row.innerHTML = `
    ${role === 'ai' ? '<div class="ai-avatar">AI</div>' : ''}
    <div class="message-content">
      <div class="bubble">${formattedHtml}</div>
      <div class="message-meta">
        <span class="timestamp">${time}</span>
        <button class="copy-btn">Copy</button>
        <button class="pin-btn" data-id="${msgId}">Pin</button>
      </div>
    </div>`;

  row.querySelector('.copy-btn').addEventListener('click', e => copyText(content, e.currentTarget));
  row.querySelector('.pin-btn').addEventListener('click', e => togglePinMessage(msgId, role, content, e.currentTarget, row));
  attachCodeBlockFeatures(row);

  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function createAiMessageRow(agentType = 'ai') {
  const msgId = 'msg-' + Date.now();
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.dataset.id = msgId;

  const time = formatTime(new Date());
  const agentBadge = agentType === 'gemini' ? '♊' : (agentType === 'nvidia' ? '🟢' : '⚡');

  row.innerHTML = `
    <div class="ai-avatar" title="${agentType.toUpperCase()}">${agentBadge}</div>
    <div class="message-content">
      <div class="bubble"></div>
      <div class="message-meta">
        <span class="timestamp">${time}</span>
        <button class="copy-btn">Copy</button>
        <button class="pin-btn" data-id="${msgId}">Pin</button>
      </div>
    </div>`;

  row.querySelector('.copy-btn').addEventListener('click', e => {
    copyText(row.querySelector('.bubble').innerText, e.currentTarget);
  });

  row.querySelector('.pin-btn').addEventListener('click', e => {
    const text = row.querySelector('.bubble').innerText;
    togglePinMessage(msgId, 'ai', text, e.currentTarget, row);
  });

  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function appendTypingIndicator(label = 'Thinking...') {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.innerHTML = `
    <div class="ai-avatar">✦</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <span style="font-size:12px;color:#666;margin-left:6px;">${label}</span>
      </div>
    </div>`;
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

// ============================================================
// FILE ATTACHMENTS
// ============================================================
function addPendingFile(file) {
  const fileObj = { id: Date.now() + Math.random(), file: file };
  pendingFiles.push(fileObj);
  renderFileChip(fileObj);
  updateSendBtn();
}

function renderFileChip(fileObj) {
  const chip = document.createElement('div');
  chip.className = 'file-chip';
  chip.dataset.id = fileObj.id;

  if (fileObj.file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.className = 'file-chip-img';
    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(fileObj.file);
    chip.appendChild(img);
  } else {
    const icon = document.createElement('span');
    icon.textContent = '📎';
    chip.appendChild(icon);
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'file-chip-name';
  nameSpan.textContent = fileObj.file.name;
  chip.appendChild(nameSpan);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'file-chip-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.title = 'Remove file';
  removeBtn.addEventListener('click', function() {
    pendingFiles = pendingFiles.filter(f => f.id !== fileObj.id);
    chip.remove();
    updateSendBtn();
  });

  chip.appendChild(removeBtn);
  filePreviewArea.appendChild(chip);
}

// ============================================================
// PINNED MESSAGES
// ============================================================
function togglePinMessage(id, role, text, btn, row) {
  const exists = pinnedMessages.some(p => p.id === id);
  if (exists) {
    pinnedMessages = pinnedMessages.filter(p => p.id !== id);
    btn.classList.remove('pinned');
    btn.textContent = 'Pin';
    row.classList.remove('is-pinned');
  } else {
    pinnedMessages.push({ id, role, text });
    btn.classList.add('pinned');
    btn.textContent = 'Pinned';
    row.classList.add('is-pinned');
  }
  saveCurrentSession();
  renderPinnedPanel();
}

function unpinMessage(id) {
  pinnedMessages = pinnedMessages.filter(p => p.id !== id);
  saveCurrentSession();
  renderPinnedPanel();

  const btn = document.querySelector(`.pin-btn[data-id="${id}"]`);
  if (btn) {
    btn.classList.remove('pinned');
    btn.textContent = 'Pin';
  }
  const row = document.querySelector(`.message-row[data-id="${id}"]`);
  if (row) {
    row.classList.remove('is-pinned');
  }
}

function renderPinnedPanel() {
  const panel = document.getElementById('pinnedPanel');
  const list = document.getElementById('pinnedList');
  const count = document.getElementById('pinnedCount');

  count.textContent = pinnedMessages.length;

  if (pinnedMessages.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'flex';
  list.innerHTML = '';

  pinnedMessages.forEach(item => {
    const pinEl = document.createElement('div');
    pinEl.className = 'pinned-item';

    const roleBadge = document.createElement('div');
    roleBadge.className = 'pinned-role';
    roleBadge.textContent = item.role === 'ai' ? 'AI' : 'U';

    const textEl = document.createElement('div');
    textEl.className = 'pinned-text';
    textEl.textContent = item.text.replace(/[*_`#]/g, '').slice(0, 140);

    const unpinBtn = document.createElement('button');
    unpinBtn.className = 'pinned-unpin';
    unpinBtn.innerHTML = '&times;';
    unpinBtn.title = 'Unpin';
    unpinBtn.addEventListener('click', e => {
      e.stopPropagation();
      unpinMessage(item.id);
    });

    pinEl.appendChild(roleBadge);
    pinEl.appendChild(textEl);
    pinEl.appendChild(unpinBtn);

    pinEl.addEventListener('click', () => {
      const targetMsg = document.querySelector(`.message-row[data-id="${item.id}"]`);
      if (targetMsg) targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    list.appendChild(pinEl);
  });
}

// ============================================================
// SESSIONS & LOCALSTORAGE
// ============================================================
function startNewSession() {
  currentSessionId = Date.now().toString();
  conversationHistory = [];
  pendingFiles = [];
  filePreviewArea.innerHTML = '';
  pinnedMessages = [];

  Array.from(messagesEl.children).forEach(child => {
    if (child.id !== 'welcome') child.remove();
  });

  welcomeEl.classList.remove('hidden');
  renderPinnedPanel();
  renderHistory();
}

function saveCurrentSession() {
  if (conversationHistory.length === 0) return;

  const firstUserMsg = conversationHistory.find(m => m.role === 'user')?.content || 'New Chat';
  const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '');

  const index = chatSessions.findIndex(s => s.id === currentSessionId);
  if (index > -1) {
    chatSessions[index].history = [...conversationHistory];
    chatSessions[index].title = title;
    chatSessions[index].pins = [...pinnedMessages];
  } else {
    chatSessions.unshift({
      id: currentSessionId,
      title: title,
      history: [...conversationHistory],
      pins: [...pinnedMessages]
    });
  }

  try {
    localStorage.setItem('cosmic_sessions', JSON.stringify(chatSessions.slice(0, 25)));
  } catch (_) {}

  renderHistory();
}

function loadSessionsFromStorage() {
  try {
    const saved = localStorage.getItem('cosmic_sessions');
    if (saved) chatSessions = JSON.parse(saved);
  } catch (_) {}
}

function renderHistory() {
  chatHistory.innerHTML = '<p class="history-label">Recent Chats</p>';

  chatSessions.forEach(session => {
    const item = document.createElement('div');
    item.className = `history-item${session.id === currentSessionId ? ' active' : ''}`;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'history-item-title';
    titleSpan.textContent = session.title;

    const delBtn = document.createElement('button');
    delBtn.className = 'history-item-del';
    delBtn.innerHTML = '&times;';
    delBtn.title = 'Delete chat';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      chatSessions = chatSessions.filter(s => s.id !== session.id);
      try {
        localStorage.setItem('cosmic_sessions', JSON.stringify(chatSessions));
      } catch (_) {}
      if (session.id === currentSessionId) startNewSession();
      renderHistory();
      showToast('Chat deleted');
    });

    item.appendChild(titleSpan);
    item.appendChild(delBtn);

    item.addEventListener('click', () => loadSession(session.id));
    chatHistory.appendChild(item);
  });
}

function loadSession(id) {
  saveCurrentSession();
  const session = chatSessions.find(s => s.id === id);
  if (!session) return;

  currentSessionId = id;
  conversationHistory = [...session.history];
  pinnedMessages = [...(session.pins || [])];

  Array.from(messagesEl.children).forEach(child => {
    if (child.id !== 'welcome') child.remove();
  });

  if (conversationHistory.length > 0) {
    welcomeEl.classList.add('hidden');
    conversationHistory.forEach(msg => {
      appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
    });
  } else {
    welcomeEl.classList.remove('hidden');
  }

  renderPinnedPanel();
  renderHistory();
  closeSidebar();
}

function clearChat() {
  conversationHistory = [];
  pendingFiles = [];
  filePreviewArea.innerHTML = '';
  pinnedMessages = [];

  Array.from(messagesEl.children).forEach(child => {
    if (child.id !== 'welcome') child.remove();
  });

  welcomeEl.classList.remove('hidden');
  renderPinnedPanel();
  saveCurrentSession();
  showToast('Chat cleared');
}

// ============================================================
// API KEYS & SETTINGS MODAL
// ============================================================
function getApiKey(type) {
  if (type === 'gemini') {
    return localStorage.getItem('cosmic_gemini_key') || '';
  } else if (type === 'nvidia') {
    return localStorage.getItem('cosmic_nvidia_key') || '';
  } else {
    return localStorage.getItem('cosmic_groq_key') || DEFAULT_GROQ_KEY;
  }
}

function loadApiKeys() {
  settingGroqKey.value = localStorage.getItem('cosmic_groq_key') || DEFAULT_GROQ_KEY;
  settingGeminiKey.value = localStorage.getItem('cosmic_gemini_key') || '';
  settingNvidiaKey.value = localStorage.getItem('cosmic_nvidia_key') || '';
}

function saveApiKeys() {
  const gKey = settingGroqKey.value.trim();
  const gemKey = settingGeminiKey.value.trim();
  const nvKey = settingNvidiaKey.value.trim();

  if (gKey) localStorage.setItem('cosmic_groq_key', gKey);
  else localStorage.removeItem('cosmic_groq_key');

  if (gemKey) localStorage.setItem('cosmic_gemini_key', gemKey);
  else localStorage.removeItem('cosmic_gemini_key');

  if (nvKey) localStorage.setItem('cosmic_nvidia_key', nvKey);
  else localStorage.removeItem('cosmic_nvidia_key');

  closeSettingsModal();
  showToast('API credentials saved');
}

function openSettingsModal() {
  loadApiKeys();
  settingsModalOverlay.classList.add('show');
}

function closeSettingsModal() {
  settingsModalOverlay.classList.remove('show');
}

// ============================================================
// EVENT LISTENERS & SETUP
// ============================================================
function setupEventListeners() {
  // Enhancer Toggle
  enhancerToggleBtn.addEventListener('click', togglePromptEnhancer);

  // View Switchers
  viewSplitBtn.addEventListener('click', () => switchViewMode('split'));
  viewEditorBtn.addEventListener('click', () => switchViewMode('editor'));
  viewChatBtn.addEventListener('click', () => switchViewMode('chat'));

  // Editor Actions
  modeCodeBtn.addEventListener('click', () => setEditorMode('code'));
  modePreviewBtn.addEventListener('click', () => {
    runLivePreview();
    setEditorMode('preview');
  });
  runPreviewBtn.addEventListener('click', runLivePreview);

  copyEditorCodeBtn.addEventListener('click', () => {
    copyText(codeTextarea.value, copyEditorCodeBtn);
  });

  // Editor Textarea events: Line numbers & Tab indentation
  codeTextarea.addEventListener('input', () => {
    updateLineNumbers();
    saveActiveEditorContent();
  });

  codeTextarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeTextarea.scrollTop;
  });

  codeTextarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      codeTextarea.value = codeTextarea.value.substring(0, start) + '  ' + codeTextarea.value.substring(end);
      codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 2;
      updateLineNumbers();
      saveActiveEditorContent();
    }
  });

  // Add File
  addFileBtn.addEventListener('click', () => {
    const filename = prompt('Enter new filename (e.g. utils.js, styles.css):');
    if (!filename) return;
    const cleanName = filename.trim();
    if (!cleanName) return;
    if (workspaceFiles[cleanName]) {
      alert('File already exists!');
      return;
    }
    workspaceFiles[cleanName] = `// ${cleanName}\n`;
    saveWorkspaceFiles();
    updateEditorFile(cleanName);
    renderFileTabs();
    renderSidebarFileList();
    showToast(`Created ${cleanName}`);
  });

  // Chat message events
  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    updateSendBtn();
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
  });

  clearChatBtn.addEventListener('click', clearChat);

  newChatBtn.addEventListener('click', () => {
    saveCurrentSession();
    startNewSession();
    closeSidebar();
  });

  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible');
  });

  sidebarOverlay.addEventListener('click', closeSidebar);

  // File Attachments
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    Array.from(e.target.files).forEach(addPendingFile);
    fileInput.value = '';
  });

  // Image Gen prompt helper
  imggenBtn.addEventListener('click', () => {
    messageInput.value = 'Generate an image of ';
    messageInput.focus();
    updateSendBtn();
  });

  // Settings Modal Events
  openSettingsBtn.addEventListener('click', openSettingsModal);
  settingsCloseBtn.addEventListener('click', closeSettingsModal);
  settingsSaveBtn.addEventListener('click', saveApiKeys);
  settingsModalOverlay.addEventListener('click', e => {
    if (e.target === settingsModalOverlay) closeSettingsModal();
  });

  // Delete History Modal Events
  deleteHistoryBtn.addEventListener('click', () => modalOverlay.classList.add('show'));
  modalCancel.addEventListener('click', () => modalOverlay.classList.remove('show'));
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('show');
  });

  modalConfirm.addEventListener('click', () => {
    chatSessions = [];
    try { localStorage.removeItem('cosmic_sessions'); } catch (_) {}
    renderHistory();
    startNewSession();
    modalOverlay.classList.remove('show');
    showToast('All chat history deleted');
  });
}

function updateSendBtn() {
  const hasText = messageInput.value.trim().length > 0;
  const hasFiles = pendingFiles.length > 0;
  sendBtn.disabled = (!hasText && !hasFiles) || isStreaming;
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
}

// ============================================================
// SPEECH RECOGNITION (VOICE INPUT)
// ============================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';

  let voiceTranscript = '';

  speechRecognition.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        voiceTranscript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    messageInput.value = (voiceTranscript + interim).trim();
    updateSendBtn();
  };

  speechRecognition.onerror = event => {
    micRecording = false;
    micBtn.classList.remove('recording');
    if (event.error !== 'no-speech') {
      showToast('Voice error: ' + event.error);
    }
  };

  speechRecognition.onend = () => {
    micRecording = false;
    micBtn.classList.remove('recording');
  };

  micBtn.addEventListener('click', () => {
    if (micRecording) {
      speechRecognition.stop();
      micRecording = false;
      micBtn.classList.remove('recording');
    } else {
      voiceTranscript = '';
      micRecording = true;
      micBtn.classList.add('recording');
      try {
        speechRecognition.start();
      } catch (_) {
        micRecording = false;
        micBtn.classList.remove('recording');
      }
    }
  });
}

// ============================================================
// SUGGESTIONS
// ============================================================
const SUGGESTIONS = [
  "Build a clean JavaScript stopwatch with lap times",
  "Write an interactive markdown note-taking app",
  "Create a minimalist CSS grid photo gallery",
  "Build an interactive quiz app with score tracking",
  "Write a responsive navigation drawer with vanilla JS",
  "Explain JavaScript closures with 3 clear code examples"
];

function refreshSuggestions() {
  const chips = document.querySelectorAll('.suggestion-chip');
  if (!chips.length) return;

  const shuffled = [...SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4);
  chips.forEach((chip, idx) => {
    if (!shuffled[idx]) return;
    chip.dataset.text = shuffled[idx];
    chip.textContent = shuffled[idx];
    chip.onclick = function() {
      messageInput.value = chip.dataset.text;
      updateSendBtn();
      sendMessage();
    };
  });
}

// ============================================================
// UTILITIES
// ============================================================
function copyText(text, btn) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
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

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

// Start application
init();