// src/components/ReviewableDiff.tsx
import React, { useMemo, useState } from "react";
import { buildDiffBlocks, buildMergedText } from "../reviewDiffModel";
import type { DiffBlock, Change } from "../reviewDiffModel";
import "../styles/review.css";

export type ReviewableDiffProps = {
    original: string;
    modified: string;
};

type Decisions = Record<string, boolean | undefined>;

const ChangeInline: React.FC<{
    change: Change;
    decision: boolean | undefined;
    onDecision: (value: boolean) => void;
}> = ({ change, decision, onDecision }) => {
    const bubbleKindClass = `change-inline__bubble change-inline__bubble--${change.type}`;

    const acceptActive = decision === true;
    const rejectActive = decision === false;

    return (
        <span className="change-inline">
            <span className={bubbleKindClass}>
                {change.type !== "add" && change.original && (
                    <span className="change-inline__original">{change.original}</span>
                )}
                {change.type === "replace" && (
                    <span className="change-inline__arrow">→</span>
                )}
                {change.type !== "remove" && change.modified && (
                    <span className="change-inline__modified">{change.modified}</span>
                )}
                {change.type === "remove" && !change.original && (
                    <span className="change-inline__modified">(remove)</span>
                )}
            </span>
            <span className="change-inline__actions">
                <button
                    type="button"
                    className={
                        "change-btn change-btn--accept" +
                        (acceptActive ? " change-btn--active" : "")
                    }
                    onClick={() => onDecision(true)}
                >
                    Accept
                </button>
                <button
                    type="button"
                    className={
                        "change-btn change-btn--reject" +
                        (rejectActive ? " change-btn--active" : "")
                    }
                    onClick={() => onDecision(false)}
                >
                    Reject
                </button>
            </span>
        </span>
    );
};

export const ReviewableDiff: React.FC<ReviewableDiffProps> = ({
    original,
    modified,
}) => {
    const blocks: DiffBlock[] = useMemo(
        () => buildDiffBlocks(original, modified),
        [original, modified]
    );

    const [decisions, setDecisions] = useState<Decisions>({});

    const mergedText = useMemo(
        () => buildMergedText(blocks, decisions),
        [blocks, decisions]
    );

    const handleDecision = (id: string, value: boolean) => {
        setDecisions((prev) => ({ ...prev, [id]: value }));
    };

    return (
        <div className="review-layout">
            {/* Left: review changes */}
            <div className="review-panel">
                <div className="review-panel__title">Review suggestions</div>
                <div className="review-panel__body">
                    {blocks.map((block, idx) => {
                        if (block.kind === "text") {
                            return <span key={idx}>{block.text}</span>;
                        }

                        const { change } = block;
                        const decision = decisions[change.id];

                        return (
                            <ChangeInline
                                key={change.id}
                                change={change}
                                decision={decision}
                                onDecision={(v) => handleDecision(change.id, v)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Right: final merged text */}
            <div className="review-panel">
                <div className="review-panel__title">Final result (after decisions)</div>
                <textarea className="review-final-text" value={mergedText} readOnly />
            </div>
        </div>
    );
};