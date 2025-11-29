// src/reviewDiffModel.ts
import { diffWords } from "diff";

export type ChangeType = "add" | "remove" | "replace";

export type Change = {
    id: string;
    type: ChangeType;
    original: string; // removed text (for remove/replace)
    modified: string; // added text (for add/replace)
};

export type DiffBlock =
    | { kind: "text"; text: string }
    | { kind: "change"; change: Change };

// Minimal shape from `diffWords`
type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

/**
 * Build higher-level change blocks from diffWords output.
 * - removed + added  => replace
 * - removed only     => remove
 * - added only       => add
 * - unchanged        => text
 */
export function buildDiffBlocks(
    original: string,
    modified: string
): DiffBlock[] {
    const parts = diffWords(original, modified) as DiffPart[];

    const blocks: DiffBlock[] = [];
    let changeCounter = 0;

    const nextId = () => `change-${changeCounter++}`;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (!part.added && !part.removed) {
            if (part.value) {
                blocks.push({ kind: "text", text: part.value });
            }
            continue;
        }

        if (part.removed) {
            const next = parts[i + 1];

            // replace: removed followed immediately by added
            if (next && next.added) {
                blocks.push({
                    kind: "change",
                    change: {
                        id: nextId(),
                        type: "replace",
                        original: part.value,
                        modified: next.value,
                    },
                });
                i++; // consume the added part as well
            } else {
                // pure removal
                blocks.push({
                    kind: "change",
                    change: {
                        id: nextId(),
                        type: "remove",
                        original: part.value,
                        modified: "",
                    },
                });
            }
            continue;
        }

        if (part.added) {
            // pure insertion
            blocks.push({
                kind: "change",
                change: {
                    id: nextId(),
                    type: "add",
                    original: "",
                    modified: part.value,
                },
            });
        }
    }

    return blocks;
}

/**
 * Build the final merged text from diff blocks and user decisions.
 * decisions[id] === true  => Accept
 * decisions[id] === false => Reject
 * decisions[id] === undefined => undecided (default: original)
 */
export function buildMergedText(
    blocks: DiffBlock[],
    decisions: Record<string, boolean | undefined>
): string {
    let result = "";

    for (const block of blocks) {
        if (block.kind === "text") {
            result += block.text;
            continue;
        }

        const { change } = block;
        const decision = decisions[change.id];

        // Default behavior if undecided:
        // - For replace/remove: keep original (no change)
        // - For add: ignore insertion
        if (decision === undefined) {
            if (change.type === "add") {
                // ignore
            } else {
                result += change.original;
            }
            continue;
        }

        // Accepted -> apply modification
        if (decision === true) {
            if (change.type === "add" || change.type === "replace") {
                result += change.modified;
            } else {
                // remove: nothing
            }
            continue;
        }

        // Rejected -> keep original state
        if (decision === false) {
            if (change.type === "add") {
                // ignore
            } else {
                // replace/remove: keep original text
                result += change.original;
            }
        }
    }

    return result;
}