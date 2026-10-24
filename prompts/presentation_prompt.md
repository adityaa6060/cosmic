Act as a Principal AI Architect and Senior Technical Presenter. Generate a complete, slide-by-slide 10-slide presentation deck for an academic course on Prompt Engineering and Generative AI Systems.

Project Title: Cosmic AI Studio — Multi-Agent In-Browser IDE & Prompt Engineering Platform
Repository: https://github.com/adityaa6060/cosmic.git

Visual Style & Design Philosophy:
- Aesthetic: Ultra-minimalist, sleek, high-end editorial design (inspired by Apple, Teenage Engineering, and Vercel).
- Color Palette: Primary: Clean Stark White (#FFFFFF), Secondary: Deep Pitch Black (#111111), Accents/Muted: Neutral Grays (#666666, #E5E5E5), Code Accent: Emerald Green (#16A34A).
- Typography: Clean sans-serif headings (Inter) paired with monospace for technical specifications and prompt syntax (JetBrains Mono).
- Form Factor: 16:9 Widescreen format optimized for Google Slides.

For each of the 10 slides, provide:
1. Slide Number & Title (High-impact, concise)
2. Slide Layout & Visual Hierarchy (Exact instructions for Google Slides layout: e.g., 2-column comparison, 3-card grid, terminal mockup, metrics split)
3. On-Slide Content (Headings, crisp bullet points, exact code/prompt snippets, and data callouts — formatted so it can be pasted directly)
4. Slide Speaker Notes (Detailed 60–90 second spoken script with academic depth, explaining the "why" behind the prompt engineering concepts)

Here is the exact 10-Slide Syllabus to cover:

- Slide 1: Title & Executive Overview (Cosmic AI: A Client-Side, Multi-Agent IDE built for Prompt Engineering & Live Code Synthesis).
- Slide 2: The Core Problem & Architectural Vision (The limitations of generic LLM web chats for coding: statelessness, copy-paste friction, and hallucinated dependencies; solving it with a serverless, live-preview IDE).
- Slide 3: Prompt Engineering Pillar I — Dynamic In-Context State Injection (How getSystemPrompt() dynamically reads the live codespace buffers [index.html, style.css, script.js] and injects them into system prompt delimiters for continuous, zero-shot code refactoring).
- Slide 4: Prompt Engineering Pillar II — Two-Stage Meta-Prompt Chaining (The Prompt Enhancer: Stage 1 Groq Qwen-27B prompt expansion turning vague prompts into strict technical specs, and Stage 2 target agent execution).
- Slide 5: Prompt Engineering Pillar III — Delimiter-Based Structured Output Enforcement (Conditioning models with negative constraints and strict markdown fencing for html, css, and javascript; how deterministic regex parsers route code buffers into file models in real-time).
- Slide 6: Reasoning & Chain-of-Thought (CoT) Token Streaming (Capturing and visualizing delta.reasoning thinking tokens from modern reasoning LLMs inside collapsible UI inspection containers).
- Slide 7: Heterogeneous Multi-Agent Architecture (Comparative matrix of integrated providers: Groq LPU with GPT-OSS 120B & Qwen 27B, Google Gemini 2.5 Flash, and NVIDIA NIM Llama 3.2 11B; matching task complexity to inference speed and model capacity).
- Slide 8: API Integration & Real-Time Streaming Mechanics (Dual-protocol client-side streaming: OpenAI-compatible Server-Sent Events [SSE] vs. Google Generative Language API streamGenerateContent?alt=sse; TextDecoder stream reader implementation).
- Slide 9: Complete Technology Stack & Runtime Isolation (Vanilla ES6+ event-driven engine, CSS3 design tokens, marked.js, highlight.js, sandboxed iframe runtime with allow-scripts allow-modals, and localStorage session state persistence).
- Slide 10: Evaluation, Key Takeaways & Future Horizons (Prompt engineering learnings, prompt latency vs. code accuracy trade-offs, and future expansions: AST-level diff patching, multi-turn unit test agents, and web container runtimes).

Format the entire output with crystal-clear text formatting so each slide is easily readable and directly transferable into Google Slides.
