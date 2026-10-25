# Cosmic AI Studio

![Cosmic AI](logo.png)

A lightweight, serverless web IDE and multi-agent AI coding workspace. Build web apps in real time with AI models from **Groq**, **Google Gemini**, and **NVIDIA NIM**.

---

## What It Does

- **Multi-Model AI Chat**: Switch between Groq (`gpt-oss-120b`, `qwen-27b`), Google Gemini (`gemini-2.5-flash`), and NVIDIA NIM (`llama-3.2-11b`) instantly.
- **Auto-Code Writing**: The AI writes directly into `index.html`, `style.css`, and `script.js` without manual copy-pasting.
- **Instant Live Preview**: Run and interact with your web app side-by-side in a sandboxed preview.
- **Prompt Enhancer**: Automatically turns brief ideas into detailed technical specs.
- **100% Client-Side & Private**: Runs entirely in your browser. No backend server, zero tracking.

---

## How to Run

### Method 1: Direct File (No Setup)
Double-click `index.html` to open it directly in any browser.

### Method 2: Local Server
Run with Python:
```bash
python -m http.server 8000
```
Or with Node:
```bash
npx serve .
```
Then open `http://localhost:8000` in your browser.

---

## API Keys Setup

Configure keys in any of these ways:

1. **In the App**: Click **Settings** in the top bar or sidebar, enter your keys, and click **Save Changes**.
2. **Via `keys.js`** (Auto-loaded, gitignored):
   ```javascript
   window.COSMIC_KEYS = {
     GROQ_API_KEY: "gsk_...",
     GEMINI_API_KEY: "AIzaSy...",
     NVIDIA_API_KEY: "nvapi-..."
   };
   ```
3. **Via `.env/keys.json`** (Auto-loaded on local servers):
   ```json
   {
     "GROQ_API_KEY": "gsk_...",
     "GEMINI_API_KEY": "AIzaSy...",
     "NVIDIA_API_KEY": "nvapi-..."
   }
   ```

---

## License

MIT
