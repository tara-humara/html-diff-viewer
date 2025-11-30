// src/components/SideBySideDiff.tsx
import React from "react";
import { diffLines, diffWords, diffChars } from "diff";
import type { DiffMode } from "./TextDiff";
import "../styles/diff.css";

type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type SideBySideDiffProps = {
    original: string;
    modified: string;
    mode: DiffMode;
};

type RowType = "unchanged" | "added" | "removed";

type Row = {
    left?: string;
    right?: string;
    type: RowType;
    leftLine?: number;
    rightLine?: number;
};

/**
 * Side-by-side diff.
 * - Left: original
 * - Right: modified
 * - Removed pieces only on the left (red)
 * - Added pieces only on the right (green)
 * - Unchanged pieces appear on both sides
 * The granularity (chars / words / lines) is controlled by `mode`.
 */
export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
    original,
    modified,
    mode,
}) => {
    // Choose the diff function based on granularity
    let parts: DiffPart[];
    if (mode === "chars") {
        parts = diffChars(original, modified) as DiffPart[];
    } else if (mode === "words") {
        parts = diffWords(original, modified) as DiffPart[];
    } else {
        // "lines"
        parts = diffLines(original, modified) as DiffPart[];
    }

    const rows: Row[] = [];
    let leftLine = 1;
    let rightLine = 1;

    parts.forEach((part) => {
        const lines = part.value.split("\n");

        lines.forEach((line, idx) => {
            // skip final empty line caused by trailing '\n'
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
        <div className="diff-container">
            {/* Header */}
            <div className="diff-sbs-header">
                <div className="diff-sbs-header-cell diff-sbs-header-cell--number">
                    #
                </div>
                <div className="diff-sbs-header-cell">Original</div>
                <div className="diff-sbs-header-cell diff-sbs-header-cell--number">
                    #
                </div>
                <div className="diff-sbs-header-cell">Modified</div>
            </div>

            {/* Rows */}
            {rows.map((row, idx) => {
                const leftBarClass =
                    row.type === "removed"
                        ? "diff-bar diff-bar--removed"
                        : "diff-bar diff-bar--unchanged";

                const rightBarClass =
                    row.type === "added"
                        ? "diff-bar diff-bar--added"
                        : "diff-bar diff-bar--unchanged";

                const leftContentKind: RowType =
                    row.type === "removed" ? "removed" : "unchanged";
                const rightContentKind: RowType =
                    row.type === "added" ? "added" : "unchanged";

                const leftContentClass = `diff-sbs-content diff-sbs-content--${leftContentKind}`;
                const rightContentClass = `diff-sbs-content diff-sbs-content--${rightContentKind}`;

                return (
                    <div key={idx} className="diff-sbs-row">
                        {/* Left bar */}
                        <div className={leftBarClass} />

                        {/* Left line number */}
                        <div className="diff-sbs-line-number diff-sbs-line-number--left">
                            {row.leftLine ?? ""}
                        </div>

                        {/* Left content */}
                        <div className={leftContentClass}>
                            {row.left === "" ? "\u00A0" : row.left}
                        </div>

                        {/* Right bar */}
                        <div className={rightBarClass} />

                        {/* Right line number */}
                        <div className="diff-sbs-line-number diff-sbs-line-number--right">
                            {row.rightLine ?? ""}
                        </div>

                        {/* Right content */}
                        <div className={rightContentClass}>
                            {row.right === "" ? "\u00A0" : row.right}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};