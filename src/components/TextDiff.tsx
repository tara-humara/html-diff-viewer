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

    // Special handling for pure line-level diff
    if (mode === "lines") {
        // Flatten parts into individual lines with their added/removed flags
        const lineRows: { line: string; added?: boolean; removed?: boolean }[] = [];

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

    // Default: chars / words rendering with inline highlights
    const diffText = parts.map((p) => p.value).join("");
    const diffLines = diffText.split("\n");

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
            {diffLines.map((line, i) => {
                // Determine if the entire line contains added or removed parts
                const isAdded = parts.some(
                    (p) => p.added && line.includes(p.value.trim())
                );
                const isRemoved = parts.some(
                    (p) => p.removed && line.includes(p.value.trim())
                );

                const lineColor =
                    isAdded && !isRemoved
                        ? "rgba(34, 197, 94, 0.15)"
                        : isRemoved && !isAdded
                            ? "rgba(239, 68, 68, 0.15)"
                            : "transparent";

                const barColor =
                    isAdded && !isRemoved
                        ? "#22c55e"
                        : isRemoved && !isAdded
                            ? "#ef4444"
                            : "transparent";

                return (
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
                            {i + 1}
                        </div>

                        {/* Line content */}
                        <div
                            style={{
                                padding: "4px 12px",
                                flex: 1,
                                whiteSpace: "pre-wrap",
                                backgroundColor: lineColor,
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