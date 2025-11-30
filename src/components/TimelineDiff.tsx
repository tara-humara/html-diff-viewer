// src/components/TimelineDiff.tsx
import React, { useMemo } from "react";
import { buildDiffBlocks, buildMergedText } from "../reviewDiffModel";
import "../styles/timeline.css";

export const TimelineDiff: React.FC<{
    original: string;
    modified: string;
}> = ({ original, modified }) => {
    // Step 1: Build diff blocks (same engine used by Review mode)
    const blocks = useMemo(
        () => buildDiffBlocks(original, modified),
        [original, modified]
    );

    // Step 2: Generate a "Reviewed" preview (static, neutral)
    const reviewedHtml = useMemo(() => {
        return blocks
            .map((b) => {
                if (b.kind === "text") return b.text;

                if (b.kind === "change") {
                    const { change } = b;
                    if (change.type === "add") {
                        return `<mark style="background: rgba(34,197,94,0.3)">+ ${change.modified}</mark>`;
                    } else if (change.type === "remove") {
                        return `<mark style="background: rgba(239,68,68,0.3); text-decoration: line-through;">- ${change.original}</mark>`;
                    } else {
                        return `
              <mark style="background: rgba(239,68,68,0.3); text-decoration: line-through;">${change.original}</mark>
              →
              <mark style="background: rgba(34,197,94,0.3);">${change.modified}</mark>
            `;
                    }
                }

                return "";
            })
            .join("");
    }, [blocks]);

    // Step 3: Default merged text = all changes rejected (neutral)
    const mergedHtml = useMemo(() => {
        const emptyDecisions = {};
        return buildMergedText(blocks, emptyDecisions);
    }, [blocks]);

    return (
        <div className="timeline-grid">
            {/* BEFORE */}
            <TimelineCard title="Before (Original)">
                <div dangerouslySetInnerHTML={{ __html: original }} />
            </TimelineCard>

            {/* AFTER */}
            <TimelineCard title="After (Proposed Update)">
                <div dangerouslySetInnerHTML={{ __html: modified }} />
            </TimelineCard>

            {/* REVIEWED PREVIEW */}
            <TimelineCard title="Reviewed (Changes Highlighted)">
                <div dangerouslySetInnerHTML={{ __html: reviewedHtml }} />
            </TimelineCard>

            {/* FINAL */}
            <TimelineCard title="Final (Merged)">
                <div dangerouslySetInnerHTML={{ __html: mergedHtml }} />
            </TimelineCard>
        </div>
    );
};

const TimelineCard: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    return (
        <div className="timeline-card">
            <div className="timeline-card-title">{title}</div>
            <div className="timeline-card-body">{children}</div>
        </div>
    );
};