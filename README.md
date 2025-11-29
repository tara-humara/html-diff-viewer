# HTML Text Diff Viewer

Small React + TypeScript + Vite app that explores how to:

- Compare two versions of HTML content (as raw text)
- Visualize diffs in several ways (unified + side-by-side)
- Let a human reviewer **accept / reject** individual changes
- See the **final merged result** after decisions

The code is organised in two main “levels”, following the technical test:

- **Level 1 – Diff visualisation**
- **Level 2 – Human-in-the-loop review (accept/reject)**

---

## 1. Tech stack

- **React 18 + TypeScript**
- **Vite** for bundling & dev server
- [`diff`](https://www.npmjs.com/package/diff) for low-level text diffing
- Plain **CSS** (no CSS framework) for diff / review styling

No backend, no persistence — all data is in memory and examples are hardcoded.

---

## 2. Getting started

```bash
npm install
npm run dev
```

Then open the printed localhost URL (usually `http://localhost:5173`).

---

## 3. Data model

All examples live in [`src/examples.ts`](./src/examples.ts):

```ts
type HtmlDiffExample = {
  id: string;
  label: string;
  original: string;
  modified: string;
};
```

These are short, realistic construction / safety snippets used across all views.

---

## 4. Level 1 – Diff visualisation

### 4.1 Views

Level 1 provides two diff views:

1. **Unified** – line-based diff with inline highlights  
   Implemented in [`TextDiff`](./src/components/TextDiff.tsx)

2. **Side-by-side** – original vs modified columns  
   Implemented in [`SideBySideDiff`](./src/components/SideBySideDiff.tsx)

Both views are selectable via the **View** dropdown in `App.tsx`.

#### Unified view

Features:

- Uses the `diff` library (`diffChars`, `diffWords`, `diffLines`)  
  Granularity can be switched via **Diff granularity**:
  - `Characters`
  - `Words`
  - `Lines`
- Line-numbered layout with:
  - A **colored change bar** on the far left
  - Background tint per line:
    - Green: only additions
    - Red: only removals
    - Blue: mixed changes
- Inline highlighting for added/removed spans inside a line
- **Collapsing of large unchanged blocks**  
  Long sequences of unchanged lines are reduced to:

  ```text
  … N unchanged lines …
  ```

  to keep the focus on edits.

Implementation highlights:

- Core rendering in `TextDiff`:
  - Converts diff parts into lines
  - Classifies each line as `"added" | "removed" | "mixed | "unchanged"`
  - Builds a list of **render rows**, some being “skipped” collapsed blocks
- Styling is extracted to [`src/styles/diff.css`](./src/styles/diff.css) so
  the component focuses only on structure, not visual details.

#### Side-by-side view

Features:

- Uses `diffLines` to get line-level changes
- Renders a simple grid:

  ```text
  # | original line     || # | modified line
  ```

- Added lines:
  - Shown on the **right** with green tint and green bar
- Removed lines:
  - Shown on the **left** with red tint and red bar
- Unchanged lines appear on both sides.

Implementation highlights:

- Implemented in [`SideBySideDiff.tsx`](./src/components/SideBySideDiff.tsx)
- Uses the same `diff.css` for change bars and general typography
- Line numbers are tracked independently for left/right, similar to Git diffs.

---

## 5. Level 2 – Human-in-the-loop review

Level 2 adds a dedicated **Review** view where a reviewer can:

- See change suggestions inline, as `[ original → modified ]` bubbles
- **Accept** or **Reject** each suggestion individually
- Use **bulk actions**: “Accept all” / “Reject all”
- See a live **Final result** panel representing the merged HTML string

This view is selectable via `View → Review (accept/reject)`.

### 5.1 High-level architecture

Level 2 is implemented on top of Level 1’s text diff using a small model layer in [`reviewDiffModel.ts`](./src/reviewDiffModel.ts):

```ts
export type ChangeType = "add" | "remove" | "replace";

export type Change = {
  id: string;
  type: ChangeType;
  original: string; // removed text (for remove/replace)
  modified: string; // added text (for add/replace)
};

export type DiffBlock =
  | { kind: "text"; text: string }      // unchanged
  | { kind: "change"; change: Change }; // atomic change group
```

There are two main functions:

1. **`buildDiffBlocks(original, modified)`**

   - Uses `diffWords` under the hood.
   - Groups low-level diff parts into **higher-level change units**:
     - `removed + added` → `type: "replace"`
     - only `removed` → `type: "remove"`
     - only `added` → `type: "add"`
     - unchanged → `DiffBlock` with `kind: "text"`
   - This gives a stable list of `DiffBlock[]` which drives the UI.

2. **`buildMergedText(blocks, decisions)`**

   ```ts
   type Decisions = Record<string, boolean | undefined>;
   // true  => accept
   // false => reject
   // undefined => undecided (default behaviour)
   ```

   - Walks through `DiffBlock[]` and reconstructs the **final HTML string**.
   - Behaviour:
     - For `replace` / `remove`:
       - **Accept** → use `modified` (or remove)
       - **Reject / undecided** → keep `original`
     - For `add`:
       - **Accept** → insert `modified`
       - **Reject / undecided** → ignore

This separation means the UI can stay simple: it just modifies a `decisions` map; `buildMergedText` takes care of applying the right behaviour.

### 5.2 Review UI

Implemented in [`ReviewableDiff.tsx`](./src/components/ReviewableDiff.tsx).

The component:

- Builds blocks once with `buildDiffBlocks(original, modified)`
- Maintains `decisions` in `useState`
- Uses `useMemo` for:
  - `mergedText = buildMergedText(blocks, decisions)`
  - `stats` derived from decisions

Layout (defined in [`src/styles/review.css`](./src/styles/review.css)):

- **Left panel – “Review suggestions”**
  - Inline `ChangeInline` components rendered within the original text flow.
  - Bubble shows:
    - Original (strikethrough, red)
    - Arrow
    - Modified (green)
  - Small **Accept / Reject** buttons next to each bubble.
  - Visual states:
    - Neutral bubble when pending
    - Green outline when accepted
    - Red outline when rejected
  - Header shows stats:
    - `Total`, `Accepted`, `Rejected`, `Pending`
  - “Accept all” and “Reject all” buttons.

- **Right panel – “Final result (after decisions)”**
  - Read-only `<textarea>` showing the merged HTML string produced by `buildMergedText`.
  - Updates live as the reviewer changes decisions.

---

## 6. App shell (`App.tsx`)

Wires everything with:

- Example selector  
- View selector  
- Diff granularity selector (for unified view)  
- Renders the correct component based on selected mode.

---

## 7. Future improvements

- Persist decisions (localStorage or API)
- Render final HTML instead of raw text
- Group changes by HTML structure (lists, sections)
- Keyboard shortcuts for reviewing
- Multi-user comments / metadata

---

