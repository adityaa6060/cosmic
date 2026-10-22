# Cosmic Studio IDE

A minimalist, high-performance web IDE and AI pair programmer built with foundational HTML, CSS, and Vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-black)
![Theme](https://img.shields.io/badge/theme-minimalist%20monochrome-black)

---

## Features

- **Triple AI Agent Support**:
  - **Groq Cloud AI**: Ultra-fast streaming inference powered by `openai/gpt-oss-120b` and Llama models.
  - **Google Gemini**: Intelligent reasoning powered by Gemini 2.0 Flash.
  - **NVIDIA NIM**: Accelerated enterprise open models like Llama 3.3 70B.
  - Switch between agents directly in the chat bar anytime.

- **✨ Groq Prompt Enhancer**:
  - Located in the topbar header.
  - Analyzes and transforms casual prompts into high-level, production-grade engineering specifications before sending.
  - Explicitly informs the user at the beginning of the response about the enhanced prompt used.

- **Integrated Code Workspace**:
  - Multi-tab file editor (`index.html`, `style.css`, `script.js`, plus custom files).
  - Synchronized line numbers and tab indentation support.
  - Persistent code storage using `localStorage`.

- **Live In-Browser Preview**:
  - 1-click **Run Preview** to test your HTML, CSS, and JavaScript in an isolated sandbox.
  - Toggle between **Split View**, **Editor Only**, and **AI Agent Only**.

- **Apply AI Code Directly**:
  - Code blocks generated in chat include an **Apply to Editor** button that instantly updates your workspace files.

- **Voice Input & Image Generation**:
  - Built-in speech recognition for hands-free prompting.
  - AI image generation with Stable Horde.

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/adityaa6060/cosmic.git
   cd cosmic
   ```

2. Open `index.html` in any modern web browser or serve locally:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .
   ```

3. Configure your API keys in the **API Keys & Settings** modal (accessible from the sidebar). Groq works immediately with the default configuration.

---

## Tech Stack

- **HTML5**: Semantic, accessible markup.
- **CSS3**: Custom minimalist black-and-white design system with zero framework overhead.
- **JavaScript**: Pure, foundational Vanilla ES2022.
- **APIs**: Groq Cloud, Google Generative AI, NVIDIA NIM, Stable Horde.
