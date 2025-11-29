// src/components/SideBySideDiff.tsx
import React from "react";
import { diffLines } from "diff";

type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type SideBySideDiffProps = {
    original: string;
    modified: string;
};

/**
 * Very simple side-by-side line diff.
 * - Left: original
 * - Right: modified
 * - Removed lines only on the left (red)
 * - Added lines only on the right (green)
 * - Unchanged lines appear on both sides
 */
export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
    original,
    modified,
}) => {
    const parts = diffLines(original.trim(), modified.trim()) as DiffPart[];

    type Row = {
        left?: string;
        right?: string;
        type: "unchanged" | "added" | "removed";
        leftLine?: number;
        rightLine?: number;
    };

    const rows: Row[] = [];
    let leftLine = 1;
    let rightLine = 1;

    parts.forEach((part) => {
        const lines = part.value.split("\n");

        lines.forEach((line, idx) => {
            // skip final empty line caused by trailing \n
            if (idx === lines.length - 1 && line === "") return;

            if (part.added) {
                rows.push({
                    left: "",
                    right: line,
                    type: "added",
                    rightLine: rightLine++,
                });
            } else if (part.removed) {
                rows.push({
                    left: line,
                    right: "",
                    type: "removed",
                    leftLine: leftLine++,
                });
            } else {
                rows.push({
                    left: line,
                    right: line,
                    type: "unchanged",
                    leftLine: leftLine++,
                    rightLine: rightLine++,
                });
            }
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
            {/* Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 60px 1fr",
                    borderBottom: "1px solid #ddd",
                    background: "#e5e7eb",
                    fontWeight: 600,
                }}
            >
                <div style={{ padding: "4px 6px", textAlign: "right" }}>#</div>
                <div style={{ padding: "4px 8px" }}>Original</div>
                <div style={{ padding: "4px 6px", textAlign: "right" }}>#</div>
                <div style={{ padding: "4px 8px" }}>Modified</div>
            </div>

            {/* Rows */}
            {rows.map((row, idx) => {
                const leftBar =
                    row.type === "removed" ? "#ef4444" : "transparent";
                const rightBar =
                    row.type === "added" ? "#22c55e" : "transparent";

                return (
                    <div
                        key={idx}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "4px 60px 1fr 4px 60px 1fr",
                            borderBottom: "1px solid #eee",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {/* Left bar */}
                        <div style={{ backgroundColor: leftBar }} />

                        {/* Left line number */}
                        <div
                            style={{
                                padding: "2px 6px",
                                textAlign: "right",
                                color: "#6b7280",
                                background: "#f1f5f9",
                                borderRight: "1px solid #ddd",
                                userSelect: "none",
                            }}
                        >
                            {row.leftLine ?? ""}
                        </div>

                        {/* Left content */}
                        <div
                            style={{
                                padding: "2px 8px",
                                backgroundColor:
                                    row.type === "removed"
                                        ? "rgba(239,68,68,0.15)"
                                        : "transparent",
                                textDecoration: row.type === "removed" ? "line-through" : "none",
                            }}
                        >
                            {row.left === "" ? "\u00A0" : row.left}
                        </div>

                        {/* Right bar */}
                        <div style={{ backgroundColor: rightBar }} />

                        {/* Right line number */}
                        <div
                            style={{
                                padding: "2px 6px",
                                textAlign: "right",
                                color: "#6b7280",
                                background: "#f1f5f9",
                                borderLeft: "1px solid #ddd",
                                borderRight: "1px solid #ddd",
                                userSelect: "none",
                            }}
                        >
                            {row.rightLine ?? ""}
                        </div>

                        {/* Right content */}
                        <div
                            style={{
                                padding: "2px 8px",
                                backgroundColor:
                                    row.type === "added"
                                        ? "rgba(34,197,94,0.15)"
                                        : "transparent",
                            }}
                        >
                            {row.right === "" ? "\u00A0" : row.right}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};