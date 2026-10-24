# Cosmic AI Studio — Multi-Agent In-Browser IDE & Prompt Engineering Platform

![Cosmic AI](logo.png)

**Cosmic AI Studio** is a serverless, client-side web IDE and multi-agent AI development environment. Designed for **Prompt Engineering and AI-assisted Software Development**, Cosmic AI integrates multiple state-of-the-art Large Language Models (LLMs) from different AI providers (Groq, Google Gemini, and NVIDIA NIM) into an unified, interactive coding workspace with real-time streaming, dynamic in-context state injection, two-stage meta-prompt chaining, and an instant sandboxed live preview.

---

## 🌟 Key Prompt Engineering Innovations

Cosmic AI Studio is built from the ground up to showcase modern prompt engineering methodologies and agentic orchestration patterns:

### 1. Dynamic In-Context State Injection (Codespace Grounding)
Rather than operating on isolated prompts, Cosmic AI continuously grounds the language model by injecting the current codespace state into the system prompt at runtime.
- Active files (`index.html`, `style.css`, `script.js`, and user-defined files) are concatenated with structured delimiters:
  ```text
  CURRENT CODESPACE:
  --- Current index.html ---
  [code]
  --- Current style.css ---
  [code]
  --- Current script.js ---
  [code]
  Build upon these existing files.
  ```
- **Prompt Engineering Impact**: Mitigates hallucinations, allows zero-shot iterative refactoring, and ensures the AI respects existing function signatures, CSS classes, and DOM IDs without manual re-prompting.

### 2. Two-Stage Meta-Prompt Chaining (Prompt Enhancer)
Cosmic AI features an optional **Prompt Enhancer** powered by Groq (`qwen/qwen3.8-27b`).
- **Stage 1 (Meta-Prompting)**: Takes raw, ambiguous user input and expands it into an unambiguous, structured technical specification covering component layout, styling requirements, and event handlers.
  > *System Prompt:* `"Expert prompt engineer. Expand the user prompt into a concise technical spec for a foundational vanilla web app. Return ONLY the enhanced prompt."*
- **Stage 2 (Agent Execution)**: The enhanced prompt is piped directly to the selected coding agent, accompanied by the full session conversation history and current codespace state.

### 3. Delimiter-Based Structured Output Enforcement
The system prompt enforces strict structural boundaries requiring models to output standard fenced markdown blocks (` ```html `, ` ```css `, ` ```javascript `).
- A deterministic client-side regex streaming parser intercepts tokens in real-time, extracts code buffers, and routes them directly to their corresponding file models.
- Eliminates manual copy-pasting and avoids conversational preamble cluttering the workspace.

### 4. Native Chain-of-Thought (CoT) & Reasoning Visualization
For models outputting explicit reasoning tokens (`delta.reasoning`), Cosmic AI parses and presents intermediate thinking steps inside collapsible, real-time inspection accordions.
- Allows students and researchers to observe the model's internal decomposition, planning, and self-correction before code synthesis begins.

---

## 🤖 Multi-Agent LLM Architecture

Cosmic AI Studio provides out-of-the-box support for heterogeneous LLM providers via a unified client-side streaming client:

| Agent Label | Model Provider | Architecture / Model ID | Context / Tokens | Protocol & Streaming | Key Strengths |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Groq (OpenAI-OSS)** | Groq Cloud | `openai/gpt-oss-120b` | 3,500 max tokens | OpenAI SSE (`/v1/chat/completions`) | Ultra-fast LPU inference, deep architectural knowledge |
| **Groq Fast** | Groq Cloud | `qwen/qwen3.8-27b` | 3,000 max tokens | OpenAI SSE (`/v1/chat/completions`) | Rapid iteration, lightweight generation, prompt enhancer |
| **Gemini** | Google GenAI | `gemini-2.5-flash` | Adaptive | Google GenAI SSE (`streamGenerateContent`) | Advanced multimodal reasoning, system instruction support |
| **NVIDIA NIM** | NVIDIA NIM | `meta/llama-3.2-11b-vision-instruct` | 2,500 max tokens | OpenAI-compatible SSE | Enterprise open weights, precision code synthesis |

---

## 🖥️ IDE & Runtime Features

- **Instant Sandboxed Live Preview**: Executes HTML, CSS, and JavaScript in an isolated `iframe` with `sandbox="allow-scripts allow-modals"`.
- **Multi-Session Codespace Manager**: Each chat thread maintains an independent codespace saved in browser `localStorage`. Switching chat sessions restores associated code files immediately.
- **Dynamic File Management**: Create custom files (`utils.js`, `data.json`), reset workspaces, or delete files directly from the sidebar.
- **Clean Minimalist Theme**: Monochromatic black-and-white visual identity with responsive split-screen and full-screen modes.
- **In-Editor Controls**: Built-in line numbering, tab indentation (`Tab` key handling), one-click clipboard copying, and manual file editing.
- **Local Privacy & Zero-Backend**: All API calls are made directly from the user's browser to the AI providers. API keys and code never touch intermediate proxy servers.

---

## 📁 Project Architecture & File Structure

```
cosmic-ai/
├── index.html         # Application layout, modals, sidebar, and editor DOM
├── style.css          # Minimalist black & white responsive design system
├── script.js          # Core engine (API clients, SSE streaming, state & sessions, parser)
├── logo.png           # Cosmic AI visual branding
├── README.md          # Comprehensive documentation and prompt engineering guide
└── .env/
    └── keys.json      # Optional pre-configured API keys (gitignored)
```

---

## ⚡ Quickstart & Setup

### 1. Launch the Studio
Because Cosmic AI is 100% client-side, no build tools or package managers are required:
```bash
# Clone the repository
git clone https://github.com/adityaa6060/cosmic.git

# Serve via any static web server (e.g. Python)
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

### 2. Configure API Keys
You can configure API keys in two ways:
1. **Via UI**: Click **Settings** in the top bar or sidebar, enter your API keys (Groq, Gemini, NVIDIA NIM), and click **Save Changes**. Keys are persisted securely in your browser's `localStorage`.
2. **Via `.env/keys.json`**: Place your keys in `.env/keys.json` (automatically loaded if served locally):
   ```json
   {
     "GROQ_API_KEY": "gsk_...",
     "GEMINI_API_KEY": "AIzaSy...",
     "NVIDIA_API_KEY": "nvapi-..."
   }
   ```

---

## 🛠️ Technology Stack

- **Frontend Core**: Vanilla HTML5, Semantic Elements, CSS3 Custom Properties (Variables)
- **Logic & Execution**: Vanilla Modern JavaScript (ES6+), Event-driven Architecture
- **Markdown & Highlighting**: [marked.js](https://github.com/markedjs/marked) for markdown rendering, [highlight.js](https://highlightjs.org/) for syntax highlighting
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts
- **AI Integrations**:
  - Groq Cloud API (OpenAI-compatible streaming completions)
  - Google Generative AI REST API (`v1beta`)
  - NVIDIA NIM API (OpenAI-compatible inference endpoints)

---

## 📜 License

MIT License. Developed for Prompt Engineering research and generative AI development.
