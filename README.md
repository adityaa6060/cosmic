# Cosmic AI Studio

A lightweight, in-browser AI coding assistant and live code editor. No installation needed — just open `index.html` in any modern browser and start building.

---

## What it does

**Cosmic AI Studio** is a simple web app that combines an AI chat with a code editor and live preview. You describe what you want to build, the AI writes the code, and it appears instantly in the editor and preview — all inside your browser.

---

## Main Features

### AI Chat with multiple models
You can pick from four AI agents to help you write code:
- **Groq (OpenAI OSS 120B)** — powerful, detailed responses
- **Groq Fast (Qwen 27B)** — quicker, lighter responses
- **Gemini 2.5 Flash** — Google's model
- **NVIDIA (Llama 3.2 11B)** — NVIDIA-hosted open model

### Each chat has its own code workspace
Every time you start a new chat, you get a fresh, empty codespace with three files: `index.html`, `style.css`, and `script.js`. When you switch between old chats in the sidebar, the editor restores that chat's code exactly as you left it.

### Code is written automatically
When the AI responds with HTML, CSS, or JavaScript code blocks, the app automatically writes them into the correct files in the editor. No copy-pasting needed.

### Live preview
Click **Run Preview** to instantly see your code running in a sandboxed iframe inside the app. The preview combines all three files together.

### Built-in code editor
- Tabs for `index.html`, `style.css`, and `script.js`
- Line numbers
- Tab key indentation
- You can also type or edit code directly — changes are saved automatically

### Prompt Enhancer
An optional toggle in the topbar. When turned on, your prompt is sent to Groq first, which rewrites it into a more detailed technical specification before passing it to the main AI agent.

### Chat history
All past chats are saved in your browser (localStorage). You can click any past chat in the sidebar to restore it, including its code.

---

## How to use

1. Open `index.html` in a browser (or serve locally with `python -m http.server`)
2. Your API keys are pre-loaded. You can update them anytime via **Settings**
3. Type what you want in the chat box and press **Enter**
4. The AI writes the code. The editor updates automatically
5. Click **Run Preview** to see it live
6. Click **+ New Chat** to start a fresh project with a clean codespace

---

## File structure

```
cosmic-ai/
├── index.html      — App layout and UI
├── style.css       — All styles
├── script.js       — All logic (editor, chat, AI calls, sessions)
├── logo.png        — App logo
└── .env/
    └── keys.json   — API keys (pre-configured, not committed to public repos)
```

---

## Tech stack

- **HTML5** — page structure
- **CSS3** — styling, no frameworks
- **Vanilla JavaScript** — all logic, no build tools or bundlers
- **Groq API** — Groq Cloud models
- **Google Generative AI API** — Gemini
- **NVIDIA NIM API** — NVIDIA-hosted open models
- **marked.js** — renders markdown in chat responses
- **highlight.js** — syntax highlighting in code blocks

---

## Notes

- Everything runs client-side. No backend, no server needed
- Code and chat history are saved in browser localStorage
- API keys are stored locally in your browser — they are never sent anywhere except directly to the respective AI provider
