// src/components/TextDiff.tsx
import React, { useEffect, useState } from "react";
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

const COLLAPSE_THRESHOLD = 3; // same idea as review views

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

    // groups of unchanged lines that are expanded (key = "start-end")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        {}
    );

    useEffect(() => {
        setExpandedGroups({});
    }, [original, modified, mode]);

    // ---------- MODE: LINES (pure line diff with collapsing) ----------
    if (mode === "lines") {
        const lineRows: { line: string; kind: LineKind; index: number }[] = [];

        // Flatten parts into individual lines with their flags
        let index = 0;
        parts.forEach((part) => {
            const lines = part.value.split("\n");
            lines.forEach((line, idx) => {
                // Skip trailing empty line caused by final '\n'
                if (idx === lines.length - 1 && line === "") return;

                const kind: LineKind = part.added
                    ? "added"
                    : part.removed
                        ? "removed"
                        : "unchanged";

                lineRows.push({ line, kind, index });
                index++;
            });
        });

        const rendered: React.ReactNode[] = [];

        const renderNormalLine = (row: (typeof lineRows)[number]) => {
            const visualKind =
                row.kind === "added"
                    ? "added"
                    : row.kind === "removed"
                        ? "removed"
                        : "unchanged";

            const rowClass = `diff-row diff-row--${visualKind}`;
            const barClass = `diff-bar diff-bar--${visualKind}`;

            return (
                <div key={row.index} className={rowClass}>
                    <div className={barClass} />
                    <div className="diff-line-number">{row.index + 1}</div>
                    <div className="diff-line-content">
                        {row.line === "" ? "\u00A0" : row.line}
                    </div>
                </div>
            );
        };

        for (let i = 0; i < lineRows.length;) {
            const row = lineRows[i];

            if (row.kind !== "unchanged") {
                rendered.push(renderNormalLine(row));
                i++;
                continue;
            }

            // collect run of unchanged lines
            let j = i;
            while (j < lineRows.length && lineRows[j].kind === "unchanged") j++;
            const count = j - i;

            if (count <= COLLAPSE_THRESHOLD) {
                for (let k = i; k < j; k++) rendered.push(renderNormalLine(lineRows[k]));
            } else {
                const groupId = `${i}-${j}`;
                const expanded = !!expandedGroups[groupId];

                if (!expanded) {
                    // collapsed summary row
                    rendered.push(
                        <div
                            key={groupId}
                            className="diff-row diff-row--skipped"
                        >
                            <div className="diff-bar diff-bar--unchanged" />
                            <div className="diff-line-number" />
                            <div className="diff-line-content diff-line-content--skipped">
                                <button
                                    type="button"
                                    className="diff-line-toggle"
                                    onClick={() =>
                                        setExpandedGroups((prev) => ({ ...prev, [groupId]: true }))
                                    }
                                >
                                    Show {count} unchanged line{count > 1 ? "s" : ""}
                                </button>
                            </div>
                        </div>
                    );
                } else {
                    for (let k = i; k < j; k++) rendered.push(renderNormalLine(lineRows[k]));
                    rendered.push(
                        <div
                            key={`${groupId}-hide`}
                            className="diff-row diff-row--skipped"
                        >
                            <div className="diff-bar diff-bar--unchanged" />
                            <div className="diff-line-number" />
                            <div className="diff-line-content diff-line-content--skipped">
                                <button
                                    type="button"
                                    className="diff-line-toggle"
                                    onClick={() =>
                                        setExpandedGroups((prev) => ({ ...prev, [groupId]: false }))
                                    }
                                >
                                    Hide unchanged lines
                                </button>
                            </div>
                        </div>
                    );
                }
            }

            i = j;
        }

        return <div className="diff-container">{rendered}</div>;
    }

    // ---------- DEFAULT: CHARS / WORDS UNIFIED VIEW WITH COLLAPSE ----------

    // Recreate full diff text so we can split by line
    const diffText = parts.map((p) => p.value).join("");
    const diffLinesArr = diffText.split("\n");

    const classifyLine = (line: string): LineKind => {
        const trimmed = line.trim();
        if (!trimmed) return "unchanged";

        const hasAdded = parts.some(
            (p) =>
                p.added && p.value.trim() !== "" && line.includes(p.value.trim())
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

    const rows = diffLinesArr.map((line, index) => ({
        line,
        kind: classifyLine(line),
        index,
    }));

    const rendered: React.ReactNode[] = [];

    const renderNormalLine = (row: (typeof rows)[number]) => {
        const visualKind =
            row.kind === "added" || row.kind === "mixed"
                ? "added"
                : row.kind === "removed"
                    ? "removed"
                    : "unchanged";

        const rowClass = `diff-row diff-row--${visualKind}`;
        const barClass = `diff-bar diff-bar--${visualKind}`;

        return (
            <div key={row.index} className={rowClass}>
                <div className={barClass} />
                <div className="diff-line-number">{row.index + 1}</div>
                <div
                    className="diff-line-content"
                    dangerouslySetInnerHTML={{
                        __html: renderLineWithHighlights(row.line, parts),
                    }}
                />
            </div>
        );
    };

    for (let i = 0; i < rows.length;) {
        const row = rows[i];

        if (row.kind !== "unchanged") {
            rendered.push(renderNormalLine(row));
            i++;
            continue;
        }

        // collect run of unchanged lines
        let j = i;
        while (j < rows.length && rows[j].kind === "unchanged") j++;
        const count = j - i;

        if (count <= COLLAPSE_THRESHOLD) {
            for (let k = i; k < j; k++) rendered.push(renderNormalLine(rows[k]));
        } else {
            const groupId = `${i}-${j}`;
            const expanded = !!expandedGroups[groupId];

            if (!expanded) {
                rendered.push(
                    <div
                        key={groupId}
                        className="diff-row diff-row--skipped"
                    >
                        <div className="diff-bar diff-bar--unchanged" />
                        <div className="diff-line-number" />
                        <div className="diff-line-content diff-line-content--skipped">
                            <button
                                type="button"
                                className="diff-line-toggle"
                                onClick={() =>
                                    setExpandedGroups((prev) => ({ ...prev, [groupId]: true }))
                                }
                            >
                                Show {count} unchanged line{count > 1 ? "s" : ""}
                            </button>
                        </div>
                    </div>
                );
            } else {
                for (let k = i; k < j; k++) rendered.push(renderNormalLine(rows[k]));
                rendered.push(
                    <div
                        key={`${groupId}-hide`}
                        className="diff-row diff-row--skipped"
                    >
                        <div className="diff-bar diff-bar--unchanged" />
                        <div className="diff-line-number" />
                        <div className="diff-line-content diff-line-content--skipped">
                            <button
                                type="button"
                                className="diff-line-toggle"
                                onClick={() =>
                                    setExpandedGroups((prev) => ({ ...prev, [groupId]: false }))
                                }
                            >
                                Hide unchanged lines
                            </button>
                        </div>
                    </div>
                );
            }
        }

        i = j;
    }

    return <div className="diff-container">{rendered}</div>;
};