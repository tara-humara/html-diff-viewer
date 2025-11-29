
# HTML Text Diff Viewer

Small React + TypeScript + Vite app exploring multiple levels of HTML comparison:

- **Compare two versions of HTML content**
- **Visualize diffs** (unified + side-by-side)
- **Review & validate edits** using Accept/Reject workflows
- **Render WYSIWYG structural HTML diffs** (Level 3)
- **See a final merged HTML result**

This project follows the structure of a real-world technical test where each level adds complexity and realism.

---

# 1. Tech Stack

- **React 18 + TypeScript**
- **Vite**
- **diff** library for low-level text diffing
- **DOMParser** + custom AST for WYSIWYG diff
- **Plain CSS modules** for styling
- No backend → all state is in-memory

---

# 2. Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

# 3. Data Model

All example snippets live in `src/examples.ts`:

```ts
type HtmlDiffExample = {
  id: string;
  label: string;
  original: string;
  modified: string;
};
```

Examples simulate realistic construction documentation.

---

# 4. Level 1 — Diff Visualisation (Raw Text)

Two pure text-based diff modes:

## 4.1 Unified View (`TextDiff.tsx`)
- Uses `diffChars`, `diffWords`, or `diffLines`
- Offers **granularity** switching
- GitHub-style visual layout with:
  - Change bars
  - Colored backgrounds
  - Inline added/removed spans
- Long unchanged blocks collapse into:

```
… N unchanged lines …
```

CSS extracted to `src/styles/diff.css`.

---

## 4.2 Side-by-Side View (`SideBySideDiff.tsx`)
- Two columns: **Original** vs **Modified**
- Line numbers on each side
- Removed lines highlighted in red (left)
- Added lines highlighted in green (right)
- Unchanged lines mirrored on both sides

Uses `diffLines` internally.

---

# 5. Level 2 — Human-in-the-loop Review (Accept/Reject)

Dedicated review mode: `ReviewableDiff.tsx`

### 5.1 Purpose
Simulates workflows where human experts verify AI-generated changes.

### 5.2 Architecture

Two central concepts:

### ✔ `buildDiffBlocks(original, modified)`
Groups raw diff parts into semantic units:

```ts
type ChangeType = "add" | "remove" | "replace";

type Change = {
  id: string;
  type: ChangeType;
  original: string;
  modified: string;
};
```

Produces a list of:

```ts
type DiffBlock =
  | { kind: "text"; text: string }
  | { kind: "change"; change: Change };
```

### ✔ `buildMergedText(blocks, decisions)`
Applies reviewer choices to produce final HTML:

- Accept add → insert modified text
- Reject add → ignore
- Accept remove → delete
- Reject remove → keep
- Accept replace → use modified
- Reject replace → keep original

### 5.3 Review UI Features

- Inline `[ old → new ]` bubbles
- Per-change Accept/Reject buttons
- “Accept all” and “Reject all”
- Live merged result
- Change counter (accepted, rejected, pending)

CSS in `src/styles/review.css`.

---

# 6. Level 3 — WYSIWYG Structural HTML Diff

This is the most advanced level, implementing a real **HTML-aware diff engine**.

It compares **DOM structures**, not raw strings.

---

# 6.1 Supported Elements

Level 3 supports:

- `<p>`
- `<h2>`
- `<ul>` / `<ol>`
- `<li>`

Bold/italic (`<strong>`, `<em>`) display correctly in side‑by‑side previews.

---

# 6.2 Level 3 Architecture Overview

### Step 1 — Parse HTML into a Tree (`parse.ts`)
HTML is parsed with `DOMParser`, then converted into a simplified AST:

```ts
type WysiwygNode =
  | { type: "root"; children: WysiwygNode[] }
  | { type: "block"; tag: "p" | "h2"; id: string; status; inlineParts }
  | { type: "ul" | "ol"; children: WysiwygNode[] }
  | { type: "li"; id: string; status; inlineParts };
```

Each block or list item receives a stable `id`.

---

### Step 2 — Tree Diff (`diff.ts`)

#### Root-level diff:
- Compare blocks by index
- Detect added/removed/changed blocks

#### List diff:
- Compare `<li>` items one-by-one
- Inline diff inside LI text via `diffWords`

#### Block diff:
- `<p>` and `<h2>` diff through inline comparisons

---

### Step 3 — Inline Word-level Diff
`diffWords()` splits text into:

- unchanged spans
- added spans
- removed spans

Rendered as:

```html
<span class="inline-added">...</span>
<span class="inline-removed">...</span>
```

---

### Step 4 — Structured Rendering (`WysiwygDiff.tsx`)
Render nodes as actual HTML:

- `<p>` → `<p>...</p>`
- `<h2>` → `<h2>...</h2>`
- `<ul>` → `<li>` children

With inline color-coded diff spans.

Buttons appear **inside the rendered blocks** without breaking HTML validity.

---

### Step 5 — Accept/Reject Integration
Level 2’s review model is reused:

```ts
type Decision = "accept" | "reject" | undefined;
Record<string, Decision>
```

Each `<p>`, `<h2>`, and `<li>` has its own controls.

Accepted nodes get a green left border (`li-accepted`), rejected nodes red.

---

# 6.3 Why This Architecture Matters (Interview Notes)

- Clean separation between:
  - HTML parsing
  - Abstract syntax tree
  - Diffing algorithm
  - Rendering logic
- Supports future nested elements easily
- Tree diffing O(n)
- Inline diffing flexible per node
- Demonstrates:
  - Parsing
  - AST design
  - Tree diffing algorithms
  - Component architecture
  - UX for change review

---

# 7. App Shell

`App.tsx` ties everything together:

- Example picker
- View mode selector:
  - Unified
  - Side‑by‑side
  - Review
  - WYSIWYG
- Centric layout

---

# 8. Future Improvements

- Persist decisions (localStorage or API)
- Highlight inline formatting diffs (`<strong>`, `<em>`)
- Keyboard-driven reviewing
- Rich-text final preview
- Reorder-aware diff (longest common subsequence)

---

# 9. License

MIT

