// src/components/TextDiff.tsx
import React from "react";
import { diffWords, diffChars, diffLines } from "diff";

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
            <div
                style={{
                    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                    fontSize: "14px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    background: "#fafafa",
                    overflowX: "auto",
                }}
            >
                {lineRows.map((row, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            whiteSpace: "pre-wrap",
                            borderBottom: "1px solid #eee",
                        }}
                    >
                        {/* Change bar */}
                        <div
                            style={{
                                width: "4px",
                                backgroundColor: row.added
                                    ? "#22c55e"
                                    : row.removed
                                        ? "#ef4444"
                                        : "transparent",
                            }}
                        />

                        {/* Line number */}
                        <div
                            style={{
                                width: "40px",
                                textAlign: "right",
                                padding: "4px 8px",
                                color: "#6b7280",
                                background: "#f1f5f9",
                                borderRight: "1px solid #ddd",
                                userSelect: "none",
                            }}
                        >
                            {i + 1}
                        </div>

                        {/* Line content */}
                        <div
                            style={{
                                padding: "4px 12px",
                                flex: 1,
                                whiteSpace: "pre-wrap",
                                backgroundColor: row.added
                                    ? "rgba(34,197,94,0.15)"
                                    : row.removed
                                        ? "rgba(239,68,68,0.15)"
                                        : "transparent",
                                textDecoration: row.removed ? "line-through" : "none",
                            }}
                        >
                            {row.line === "" ? "\u00A0" : row.line}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // --------- DEFAULT: CHARS / WORDS UNIFIED VIEW WITH COLLAPSE ---------

    // Recreate full diff text so we can split by line
    const diffText = parts.map((p) => p.value).join("");
    const diffLines = diffText.split("\n");

    type LineKind = "added" | "removed" | "mixed" | "unchanged";

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
        <div
            style={{
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "#fafafa",
                overflowX: "auto",
            }}
        >
            {rows.map((row, idx) => {
                if (row.kind === "skipped") {
                    const hiddenCount = row.endIndex - row.startIndex + 1;
                    if (hiddenCount <= 0) return null;

                    return (
                        <div
                            key={`skipped-${idx}`}
                            style={{
                                display: "flex",
                                borderBottom: "1px solid #eee",
                                fontStyle: "italic",
                                color: "#6b7280",
                                background: "#f9fafb",
                            }}
                        >
                            {/* Bar */}
                            <div
                                style={{
                                    width: "4px",
                                    backgroundColor: "transparent",
                                }}
                            />
                            {/* Line number cell (blank) */}
                            <div
                                style={{
                                    width: "40px",
                                    textAlign: "right",
                                    padding: "4px 8px",
                                    background: "#f1f5f9",
                                    borderRight: "1px solid #ddd",
                                    userSelect: "none",
                                }}
                            />
                            {/* Message */}
                            <div
                                style={{
                                    padding: "4px 12px",
                                    flex: 1,
                                }}
                            >
                                … {hiddenCount} unchanged line
                                {hiddenCount > 1 ? "s" : ""} …
                            </div>
                        </div>
                    );
                }

                // context row (actual line)
                const { line, lineIndex, meta } = row;

                const barColor =
                    meta === "added"
                        ? "#22c55e"
                        : meta === "removed"
                            ? "#ef4444"
                            : meta === "mixed"
                                ? "#3b82f6"
                                : "transparent";

                const lineBg =
                    meta === "added"
                        ? "rgba(34,197,94,0.15)"
                        : meta === "removed"
                            ? "rgba(239,68,68,0.15)"
                            : meta === "mixed"
                                ? "rgba(59,130,246,0.12)"
                                : "transparent";

                return (
                    <div
                        key={`line-${idx}-${lineIndex}`}
                        style={{
                            display: "flex",
                            whiteSpace: "pre-wrap",
                            borderBottom: "1px solid #eee",
                        }}
                    >
                        {/* Change bar */}
                        <div
                            style={{
                                width: "4px",
                                backgroundColor: barColor,
                            }}
                        />

                        {/* Line number */}
                        <div
                            style={{
                                width: "40px",
                                textAlign: "right",
                                padding: "4px 8px",
                                color: "#6b7280",
                                background: "#f1f5f9",
                                borderRight: "1px solid #ddd",
                                userSelect: "none",
                            }}
                        >
                            {lineIndex + 1}
                        </div>

                        {/* Line content with inline highlights */}
                        <div
                            style={{
                                padding: "4px 12px",
                                flex: 1,
                                whiteSpace: "pre-wrap",
                                backgroundColor: lineBg,
                            }}
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