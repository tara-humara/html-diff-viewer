// src/components/TextDiff.tsx
import React from "react";
import { diffWords } from "diff";

export type TextDiffProps = {
    original: string;
    modified: string;
};

/**
 * Stateless component that displays a word-level diff
 * between two raw HTML strings.
 *
 * - Additions are shown with a green-ish background
 * - Deletions are shown with a red-ish background and strikethrough
 * - Unchanged text is shown normally
 *
 * NOTE: We display the HTML as plain text, not rendered HTML,
 * so tags like <p> and <ul> appear literally.
 */
export const TextDiff: React.FC<TextDiffProps> = ({ original, modified }) => {
    const parts = diffWords(original.trim(), modified.trim());

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
            }}
        >
            {parts.map((part, index) => {
                if (part.added) {
                    return (
                        <span
                            key={index}
                            style={{
                                backgroundColor: "rgba(0, 200, 0, 0.15)",
                                textDecoration: "none",
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
                                backgroundColor: "rgba(255, 0, 0, 0.15)",
                                textDecoration: "line-through",
                            }}
                        >
                            {part.value}
                        </span>
                    );
                }

                // unchanged
                return <span key={index}>{part.value}</span>;
            })}
        </div>
    );
};