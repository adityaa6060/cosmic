Act as a distinguished Computer Science Professor and Principal Generative AI Engineer. Write an exhaustive, rigorous, and publication-grade Course Project Report for an advanced Prompt Engineering and Generative AI curriculum.

Project Name: Cosmic AI Studio — A Multi-Agent, In-Browser IDE Grounded on Dynamic Prompt Engineering and Streaming API Orchestration
GitHub Repository: https://github.com/adityaa6060/cosmic.git
Core Technologies: Vanilla JavaScript (ES6+), HTML5, CSS3, Groq Cloud API, Google Generative AI API (Gemini), NVIDIA NIM API, marked.js, highlight.js.

The project source code implements:
1. Dynamic In-Context Codespace State Injection in getSystemPrompt():
   Reads files['index.html'], files['style.css'], files['script.js'] and injects them into the system prompt:
   [CURRENT CODESPACE:
   --- Current index.html ---
   ...
   --- Current style.css ---
   ...
   --- Current script.js ---
   ...
   Build upon these existing files.]
2. Two-Stage Meta-Prompt Chaining (enhancePrompt()):
   Intercepts user prompts using Groq (qwen/qwen3.8-27b) with the system prompt:
   "Expert prompt engineer. Expand the user prompt into a concise technical spec for a foundational vanilla web app. Return ONLY the enhanced prompt."
3. Delimiter-Based Structured Output Enforcement & Stream Parsing:
   Enforces strict markdown fenced blocks (html, css, javascript), with live regex extraction (extractCodeBlocks()) that streams code directly into the IDE editor without user intervention.
4. Multi-Provider Streaming Engine:
   - OpenAI SSE streaming (https://api.groq.com/openai/v1/chat/completions and https://integrate.api.nvidia.com/v1/chat/completions) extracting both delta.content and delta.reasoning.
   - Google Generative AI SSE streaming (streamGenerateContent?alt=sse) parsing candidates and parts.
5. Client-Side Runtime & State Machine:
   LocalStorage-backed session management (cosmic_sessions), multi-file codespace, live sandboxed iframe execution runtime (srcdoc), and minimalist monochromatic UI.

Write a complete, structured, and authoritative report adhering to the following IEEE/ACM-style academic structure:

# Title & Abstract
- An executive abstract (250–300 words) summarizing the problem statement, prompt engineering contributions, multi-agent streaming architecture, and results.

# 1. Introduction & Motivation
- The paradigm shift from passive chat interfaces to active AI-assisted development environments.
- Challenges of context drift, code fragmentation, and hallucination in stateless LLM prompting.
- Project objectives and core hypotheses.

# 2. System Architecture & Component Design
- Comprehensive ASCII or Mermaid architectural diagram showing the flow between User Input, Prompt Enhancer, Context Injector, Provider APIs, Stream Reader, Regex Buffer Parser, Editor State, and Sandboxed Iframe.
- Client-side execution model: Advantages of serverless zero-backend architectures for privacy, latency, and credential protection.
- Session state machine and discrete codespace isolation in localStorage.

# 3. Prompt Engineering Methodologies & Taxonomy
Provide an in-depth breakdown of every prompt engineering technique utilized, including verbatim system prompts, analysis, and rationale:
- 3.1. Role Conditioning & Negative Constraints: Restricting generation to foundational Vanilla web technologies (avoiding heavyweight node/bundler baggage).
- 3.2. Dynamic In-Context Learning & Grounding: How active file state injection prevents regression and enables incremental refactoring.
- 3.3. Meta-Prompting & Two-Stage Chaining: Detailed analysis of the Prompt Enhancer pipeline, demonstrating before-and-after prompt transformations (e.g., transforming "Make a calculator" into a modular component specification with DOM event delegation and CSS grid).
- 3.4. Output Formatting Guardrails: Utilizing markdown delimiter contracts to enable programmatic AST/regex capture.
- 3.5. Chain-of-Thought (CoT) & Reasoning Extraction: Capturing model planning phases to improve code generation fidelity and transparency.

# 4. Multi-Agent Heterogeneous LLM Integration
- Comparative analysis of the 4 configured agents:
  1. Groq (OpenAI-OSS 120B)
  2. Groq Fast (Qwen 27B)
  3. Gemini (2.5 Flash)
  4. NVIDIA NIM (Llama 3.2 11B)
- Dual-protocol SSE streaming implementation: Comparing OpenAI delta streaming vs. Google Generative Language API candidates streaming.
- Error resilience, rate-limit recovery, and fallback strategies.

# 5. UI/UX Design & Sandboxed Runtime
- Visual design rationale: Minimalist high-contrast monochromatic aesthetic (white primary, black secondary) to optimize cognitive ergonomics.
- Sandboxed execution safety: Utilizing sandbox="allow-scripts allow-modals" inside dynamic srcdoc iframes to prevent parent window DOM pollution or XSS attacks.

# 6. Empirical Evaluation & Prompt Performance Analysis
- Evaluation rubric: Code Completeness, Syntactic Validity, Contextual Awareness across multiple iterations, and Prompt Enhancement Quality.
- Comparative qualitative case study: Standard Zero-Shot Prompting vs. Cosmic AI Enhanced In-Context Prompting.

# 7. Limitations & Future Research
- Context window scaling challenges with large multi-file projects.
- Potential integration of AST-based diff patchers (e.g., search/replace blocks vs. full file regeneration).
- Autonomous test-driven feedback loops using headless execution logs.

# 8. Conclusion & Academic Summary
- Synthesizing findings on how intentional prompt design and runtime context grounding elevate LLMs into dependable software development partners.

# References & Appendices
- Annotated source code listings of key algorithms (getSystemPrompt, enhancePrompt, callAgent, extractCodeBlocks).

Ensure the tone is academic, technically precise, and rich with concrete code examples, formulas, prompt snippets, and architectural explanations.
