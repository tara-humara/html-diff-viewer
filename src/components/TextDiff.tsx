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

/**
 * Stateless component that displays a diff between two raw HTML strings.
 * Granularity can be characters, words or lines.
 */
export const TextDiff: React.FC<TextDiffProps> = ({
    original,
    modified,
    mode = "words",
}) => {
    const parts = getDiffParts(original, modified, mode);

    return (
        <div
            style={{
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "12px",
                background: "#fafafa",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
            }}
        >
            {parts.map((part, index) => {
                const baseStyle: React.CSSProperties = {
                    padding: part.added || part.removed ? "0 1px" : undefined,
                };

                if (part.added) {
                    return (
                        <span
                            key={index}
                            style={{
                                ...baseStyle,
                                backgroundColor: "rgba(34, 197, 94, 0.2)", // Added
                            }}
                        >
                            {part.value}
                        </span>
                    );
                }

                if (part.removed) {
                    return (
                        <span
                            key={index}
                            style={{
                                ...baseStyle,
                                backgroundColor: "rgba(239, 68, 68, 0.2)", // Removed
                                textDecoration: "line-through",
                            }}
                        >
                            {part.value}
                        </span>
                    );
                }

                // Unchanged
                return <span key={index}>{part.value}</span>;
            })}
        </div>
    );
};