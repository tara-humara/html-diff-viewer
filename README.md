# HTML Text Diff Viewer

A complete workspace for comparing, reviewing, and validating HTML edits
--- including **AI‑generated modifications**.

## ✨ Features

-   **Upload HTML files** or pick from built‑in examples\
-   **Ask AI to rewrite HTML** using custom instructions\
-   **Compare original vs modified** using:
    -   Unified diff
    -   Side‑by‑side diff
    -   WYSIWYG HTML structural diff
-   **Human‑in‑the‑loop review workflow**
    -   Accept/reject individual changes
    -   Collapsed unchanged blocks inside and outside lists
    -   Final merged HTML view
    -   **Editable HTML preview**
    -   **Download final merged HTML**
-   **DOM‑aware diff engine** for real structural comparison

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   React + TypeScript\
-   Vite\
-   Node.js backend (AI rewrite)\
-   OpenAI API\
-   Custom HTML parser + AST for WYSIWYG diff

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Install dependencies

``` bash
npm install
```

### 2. Start the frontend

``` bash
npm run dev
```

Runs at:\
➡️ http://localhost:5173

### 3. Backend for AI rewrite

Create `.env`:

    OPENAI_API_KEY=your_openai_key_here

Start backend:

``` bash
node server.js
```

------------------------------------------------------------------------

## 📁 Project Structure

    src/
      components/
        TextDiff.tsx
        SideBySideDiff.tsx
        ReviewableDiff.tsx
      wysiwyg/
        parse.ts
        diff.ts
        WysiwygDiff.tsx
        styles.css
      styles/
        diff.css
        review.css
      App.tsx
      examples.ts
    server.js

------------------------------------------------------------------------

## 🔍 Levels of Functionality

### 1. Text Diff --- Unified + Side‑by‑Side

-   Character, word, and line diff\
-   GitHub‑style visuals\
-   Collapsible unchanged regions

------------------------------------------------------------------------

### 2. Review Mode --- Accept/Reject

-   Inline change bubbles\
-   Accept all / Reject all\
-   Tracks accepted, rejected, pending\
-   Final merged HTML view

------------------------------------------------------------------------

### 3. WYSIWYG HTML Structural Diff

-   HTML → AST parsing\
-   Supports:
    -   `<p>`, `<h1>`--`<h6>`, lists, nested lists
    -   Collapsed unchanged blocks
    -   Inline formatting preservation (`<b>`, `<i>`, `<a>`, `<span>`,
        ...)
-   Click‑to‑edit final merged HTML\
-   Download final merged HTML

------------------------------------------------------------------------

## 🤖 AI Rewrite Mode

Steps:

1.  Paste or upload HTML\
2.  Provide instructions\
3.  Generate AI draft\
4.  Review changes visually\
5.  Export final HTML

Endpoint:

    POST /api/rewrite-html

Returns:

``` json
{ "modifiedHtml": "<p>Updated content…</p>" }
```

------------------------------------------------------------------------

## 📌 Planned Enhancements

-   Persistent review state\
-   Additional HTML element support\
-   Table + div diff\
-   Side‑by‑side WYSIWYG\
-   Multi‑user collaboration

------------------------------------------------------------------------

## 📄 License

MIT
