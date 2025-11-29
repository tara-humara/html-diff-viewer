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
    const containerClass =
        "change-inline" +
        (decision === true
            ? " change-inline--accepted"
            : decision === false
                ? " change-inline--rejected"
                : "");

    const acceptActive = decision === true;
    const rejectActive = decision === false;

    return (
        <span className={containerClass}>
            <span className={bubbleKindClass}>
                {/* visible bubble */}
                {change.type !== "add" && change.original && (
                    <span className="change-inline__original">{change.original}</span>
                )}
                {change.type === "replace" && (
                    <span className="change-inline__arrow">→</span>
                )}
                {change.type !== "remove" && change.modified && (
                    <span className="change-inline__modified">{change.modified}</span>
                )}

                {/* tooltip */}
                <span className="change-tooltip">
                    {change.type === "replace" && `Replace:\n- ${change.original}\n+ ${change.modified}`}
                    {change.type === "add" && `Add:\n+ ${change.modified}`}
                    {change.type === "remove" && `Remove:\n- ${change.original}`}
                </span>
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

    // List of all changes (for stats + bulk actions)
    const changes: Change[] = useMemo(
        () =>
            blocks
                .filter((b) => b.kind === "change")
                .map((b) => (b as { kind: "change"; change: Change }).change),
        [blocks]
    );

    const stats = useMemo(() => {
        const total = changes.length;
        let accepted = 0;
        let rejected = 0;

        for (const change of changes) {
            const d = decisions[change.id];
            if (d === true) accepted++;
            else if (d === false) rejected++;
        }

        const pending = total - accepted - rejected;
        return { total, accepted, rejected, pending };
    }, [changes, decisions]);

    const mergedText = useMemo(
        () => buildMergedText(blocks, decisions),
        [blocks, decisions]
    );

    const handleDecision = (id: string, value: boolean) => {
        setDecisions((prev) => ({ ...prev, [id]: value }));
    };

    const handleBulk = (value: boolean) => {
        setDecisions((prev) => {
            const next: Decisions = { ...prev };
            for (const change of changes) {
                next[change.id] = value;
            }
            return next;
        });
    };

    return (
        <div className="review-layout">
            {/* Left: review changes */}
            <div className="review-panel">
                <div className="review-panel__header">
                    <div>
                        <div className="review-panel__title">Review suggestions</div>
                        <div className="review-stats">
                            <span className="review-stats__pill">
                                Total: {stats.total}
                            </span>
                            <span className="review-stats__pill review-stats__pill--accepted">
                                Accepted: {stats.accepted}
                            </span>
                            <span className="review-stats__pill review-stats__pill--rejected">
                                Rejected: {stats.rejected}
                            </span>
                            <span className="review-stats__pill review-stats__pill--pending">
                                Pending: {stats.pending}
                            </span>
                        </div>
                    </div>
                    <div className="review-bulk-actions">
                        <button
                            type="button"
                            className="review-bulk-btn review-bulk-btn--accept"
                            onClick={() => handleBulk(true)}
                            disabled={changes.length === 0}
                        >
                            Accept all
                        </button>
                        <button
                            type="button"
                            className="review-bulk-btn review-bulk-btn--reject"
                            onClick={() => handleBulk(false)}
                            disabled={changes.length === 0}
                        >
                            Reject all
                        </button>
                    </div>
                </div>

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