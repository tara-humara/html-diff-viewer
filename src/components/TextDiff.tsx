// src/components/TextDiff.tsx
import React from "react";
import { diffWords, diffChars, diffLines } from "diff";
import "../styles/diff.css";

export type DiffMode = "words" | "chars" | "lines";

// Minimal shape of a diff "part" we care about
type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type TextDiffProps = {
    original: string;
    modified: string;
    mode?: DiffMode; // default = "words"
};

const getDiffParts = (
    original: string,
    modified: string,
    mode: DiffMode
): DiffPart[] => {
    const trimmedOriginal = original.trim();
    const trimmedModified = modified.trim();

    switch (mode) {
        case "chars":
            return diffChars(trimmedOriginal, trimmedModified) as DiffPart[];
        case "lines":
            return diffLines(trimmedOriginal, trimmedModified) as DiffPart[];
        case "words":
        default:
            return diffWords(trimmedOriginal, trimmedModified) as DiffPart[];
    }
};

/** Escape HTML before inserting via innerHTML */
const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

/**
 * Converts diff parts into highlighted HTML for a single line.
 * Used for chars/words modes.
 */
const renderLineWithHighlights = (line: string, parts: DiffPart[]): string => {
    let html = "";
    let cursor = 0;

    for (const part of parts) {
        const idx = line.indexOf(part.value, cursor);

        if (idx === -1) continue;

        const before = line.slice(cursor, idx);
        html += escapeHtml(before);

        const escapedValue = escapeHtml(part.value);

        if (part.added) {
            html += `<span style="background: rgba(34,197,94,0.2);">${escapedValue}</span>`;
        } else if (part.removed) {
            html += `<span style="background: rgba(239,68,68,0.2); text-decoration: line-through;">${escapedValue}</span>`;
        } else {
            html += escapedValue;
        }

        cursor = idx + part.value.length;
    }

    // Remaining unmatched text
    html += escapeHtml(line.slice(cursor));

    return html;
};

type LineKind = "added" | "removed" | "mixed" | "unchanged";

/**
 * Stateless component that displays a diff between two raw HTML strings.
 * Granularity can be characters, words, or lines.
 */
export const TextDiff: React.FC<TextDiffProps> = ({
    original,
    modified,
    mode = "words",
}) => {
    const parts = getDiffParts(original, modified, mode);

    // --------- SPECIAL CASE: PURE LINE MODE (line-level diff) ---------
    if (mode === "lines") {
        // Flatten parts into individual lines with their added/removed flags
        const lineRows: { line: string; added?: boolean; removed?: boolean }[] =
            [];

        parts.forEach((part) => {
            const lines = part.value.split("\n");

            lines.forEach((line, idx) => {
                // Skip trailing empty line caused by final '\n'
                if (idx === lines.length - 1 && line === "") return;
                lineRows.push({ line, added: part.added, removed: part.removed });
            });
        });

        return (
            <div className="diff-container">
                {lineRows.map((row, i) => {
                    const kind: LineKind = row.added
                        ? "added"
                        : row.removed
                            ? "removed"
                            : "unchanged";

                    const rowClass = `diff-row diff-row--${kind}`;
                    const barClass = `diff-bar diff-bar--${kind}`;

                    return (
                        <div key={i} className={rowClass}>
                            <div className={barClass} />
                            <div className="diff-line-number">{i + 1}</div>
                            <div className="diff-line-content">
                                {row.line === "" ? "\u00A0" : row.line}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // --------- DEFAULT: CHARS / WORDS UNIFIED VIEW WITH COLLAPSE ---------

    // Recreate full diff text so we can split by line
    const diffText = parts.map((p) => p.value).join("");
    const diffLines = diffText.split("\n");

    const classifyLine = (line: string): LineKind => {
        const trimmed = line.trim();
        if (!trimmed) return "unchanged";

        const hasAdded = parts.some(
            (p) => p.added && p.value.trim() !== "" && line.includes(p.value.trim())
        );
        const hasRemoved = parts.some(
            (p) =>
                p.removed && p.value.trim() !== "" && line.includes(p.value.trim())
        );

        if (hasAdded && hasRemoved) return "mixed";
        if (hasAdded) return "added";
        if (hasRemoved) return "removed";
        return "unchanged";
    };

    const lineKinds: LineKind[] = diffLines.map((line) => classifyLine(line));

    type RenderRow =
        | {
            kind: "context";
            line: string;
            lineIndex: number;
            meta: LineKind;
        }
        | {
            kind: "skipped";
            startIndex: number;
            endIndex: number;
        };

    const rows: RenderRow[] = [];
    const COLLAPSE_THRESHOLD = 4; // min unchanged lines to collapse

    let i = 0;
    while (i < diffLines.length) {
        if (lineKinds[i] === "unchanged") {
            let j = i;
            while (j < diffLines.length && lineKinds[j] === "unchanged") {
                j++;
            }
            const blockLength = j - i;

            if (blockLength > COLLAPSE_THRESHOLD) {
                // first unchanged line
                rows.push({
                    kind: "context",
                    line: diffLines[i],
                    lineIndex: i,
                    meta: "unchanged",
                });
                // collapsed middle lines
                rows.push({
                    kind: "skipped",
                    startIndex: i + 1,
                    endIndex: j - 2 >= i + 1 ? j - 2 : i + 1,
                });
                // last unchanged line
                rows.push({
                    kind: "context",
                    line: diffLines[j - 1],
                    lineIndex: j - 1,
                    meta: "unchanged",
                });
            } else {
                // keep all unchanged lines visible
                for (let k = i; k < j; k++) {
                    rows.push({
                        kind: "context",
                        line: diffLines[k],
                        lineIndex: k,
                        meta: "unchanged",
                    });
                }
            }

            i = j;
        } else {
            rows.push({
                kind: "context",
                line: diffLines[i],
                lineIndex: i,
                meta: lineKinds[i],
            });
            i++;
        }
    }

    return (
        <div className="diff-container">
            {rows.map((row, idx) => {
                if (row.kind === "skipped") {
                    const hiddenCount = row.endIndex - row.startIndex + 1;
                    if (hiddenCount <= 0) return null;

                    return (
                        <div
                            key={`skipped-${idx}`}
                            className="diff-row diff-row--skipped"
                        >
                            <div className="diff-bar diff-bar--unchanged" />
                            <div className="diff-line-number" />
                            <div className="diff-line-content diff-line-content--skipped">
                                … {hiddenCount} unchanged line
                                {hiddenCount > 1 ? "s" : ""} …
                            </div>
                        </div>
                    );
                }

                const { line, lineIndex, meta } = row;

                const rowClass = `diff-row diff-row--${meta}`;
                const barClass = `diff-bar diff-bar--${meta}`;

                return (
                    <div key={`line-${idx}-${lineIndex}`} className={rowClass}>
                        <div className={barClass} />
                        <div className="diff-line-number">{lineIndex + 1}</div>
                        <div
                            className="diff-line-content"
                            dangerouslySetInnerHTML={{
                                __html: renderLineWithHighlights(line, parts),
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};