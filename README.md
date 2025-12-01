# HTML Text Diff Viewer (Updated)

A complete workspace for comparing, reviewing, and validating HTML edits — including **AI‑generated modifications**.

## ✨ Features

- **Upload HTML files** or pick from built‑in examples  
- **Ask AI to rewrite HTML** using custom instructions  
- **Compare original vs modified** using:
  - Unified diff
  - Side‑by‑side diff
  - WYSIWYG HTML structural diff
- **Human‑in‑the‑loop review workflow**
  - Accept/reject individual changes
  - Final merged HTML view
- **DOM‑aware diff engine** for real structural comparison

---

## 🛠️ Tech Stack

- React + TypeScript  
- Vite  
- diff library for textual diffs  
- Custom HTML parser + AST for WYSIWYG diff  
- Node.js backend (AI rewrite)  
- OpenAI API  

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

App runs on:  
➡️ http://localhost:5173

### 3. Setup backend for AI rewrite

Create `.env`:

```
OPENAI_API_KEY=your_openai_key_here
```

Start backend:

```bash
node server.js
```

---

## 📁 Project Structure

```
src/
  components/
    TextDiff.tsx
    SideBySideDiff.tsx
    ReviewableDiff.tsx
  wysiwyg/
    parse.ts
    diff.ts
    WysiwygDiff.tsx
  styles/
    diff.css
    review.css
  App.tsx
  examples.ts
server.js
```

---

# 🔍 Levels of Functionality

## 1. Text Diff — Unified + Side‑by‑Side

- Character, word, or line diff  
- Highlight added/removed blocks  
- Collapsible unchanged ranges  
- GitHub-style visuals  

---

## 2. Review Mode — Accept/Reject

- Inline change bubbles  
- Accept all / Reject all  
- Track accepted/rejected/pending  
- Final merged HTML always visible  

Uses internal block model:

```ts
type ChangeType = "add" | "remove" | "replace";
```

---

## 3. WYSIWYG HTML Diff (Structural)

The most advanced part of the project.

- Converts HTML to a simplified AST  
- Diffs blocks (`<p>`, `<h2>`, `<ul>`, `<li>`)  
- Inline word-level diff inside block nodes  
- Accept/reject buttons on each block  
- Collapsed unchanged nodes  

Not text diff — **real HTML tree diff**.

---

## 🤖 AI Rewrite Mode (New)

Input options include:

- Example snippets  
- File uploads  
- **AI draft generator**

You can:

1. Paste HTML  
2. Enter instructions (e.g., "Make tone more formal", "Add safety disclaimer")  
3. Generate an AI-modified draft  
4. Review changes using diff tools  

Backend endpoint:

```
POST /api/rewrite-html
```

Returns:

```json
{ "modifiedHtml": "<p>Updated text...</p>" }
```

---

## 📌 Planned Enhancements

- Persist review state  
- Highlight HTML tag-level changes  
- Add table + div diff support  
- Side-by-side WYSIWYG  
- Multi-user collab  

---

## 📄 License
MIT
