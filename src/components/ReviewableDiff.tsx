// src/components/ReviewableDiff.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildDiffBlocks, buildMergedText } from "../reviewDiffModel";
import type { DiffBlock, Change } from "../reviewDiffModel";
import { EmptyState } from "./EmptyState";
import "../styles/review.css";

export type ReviewableDiffProps = {
    original: string;
    modified: string;
};

type Decisions = Record<string, boolean | undefined>;

type ChangeInlineProps = {
    change: Change;
    decision: boolean | undefined;
    onDecision: (value: boolean) => void;
    isActive: boolean;
    onActivate: () => void;
    index: number; // 0-based index of this change
    total: number; // total number of changes
};

const ChangeInline = React.forwardRef<HTMLSpanElement, ChangeInlineProps>(
    ({ change, decision, onDecision, isActive, onActivate, index, total }, ref) => {
        const bubbleKindClass = `change-inline__bubble change-inline__bubble--${change.type}`;
        const containerClass =
            "change-inline" +
            (decision === true
                ? " change-inline--accepted"
                : decision === false
                    ? " change-inline--rejected"
                    : "") +
            (isActive ? " change-inline--active" : "");

        const acceptActive = decision === true;
        const rejectActive = decision === false;
        const indexLabel = `${index + 1}/${total}`;

        return (
            <span ref={ref} className={containerClass} onClick={() => onActivate()}>
                {/* small index pill like "3/12" */}
                <span className="change-inline__index-pill">{indexLabel}</span>

                <span className={bubbleKindClass}>
                    {/* visible bubble content */}
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

                    {/* tooltip */}
                    <span className="change-tooltip">
                        {change.type === "replace" &&
                            `Replace:\n- ${change.original}\n+ ${change.modified}`}
                        {change.type === "add" && `Add:\n+ ${change.modified}`}
                        {change.type === "remove" && `Remove:\n- ${change.original}`}
                    </span>
                </span>

                <span
                    className="change-inline__actions"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className={
                            "change-btn change-btn--accept" +
                            (acceptActive ? " change-btn--active" : "")
                        }
                        onClick={() => onDecision(true)}
                        aria-label="Accept change"
                        title="Accept change"
                    >
                        <span className="change-btn__icon">✓</span>
                    </button>
                    <button
                        type="button"
                        className={
                            "change-btn change-btn--reject" +
                            (rejectActive ? " change-btn--active" : "")
                        }
                        onClick={() => onDecision(false)}
                        aria-label="Reject change"
                        title="Reject change"
                    >
                        <span className="change-btn__icon">✕</span>
                    </button>
                </span>
            </span>
        );
    }
);

ChangeInline.displayName = "ChangeInline";

export const ReviewableDiff: React.FC<ReviewableDiffProps> = ({
    original,
    modified,
}) => {
    const blocks: DiffBlock[] = useMemo(
        () => buildDiffBlocks(original, modified),
        [original, modified]
    );

    const [decisions, setDecisions] = useState<Decisions>({});
    const [showRendered, setShowRendered] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Track which unchanged blocks are expanded (for collapse / expand)
    const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>(
        {}
    );

    // Reset when example changes
    useEffect(() => {
        setExpandedBlocks({});
        setActiveIndex(null);
        setDecisions({});
    }, [original, modified]);

    // List of all changes (for stats + keyboard navigation)
    const changes: Change[] = useMemo(
        () =>
            blocks
                .filter((b) => b.kind === "change")
                .map((b) => (b as { kind: "change"; change: Change }).change),
        [blocks]
    );

    const hasChanges = changes.length > 0;

    // Map change id -> index in `changes`
    const changeIndexMap = useMemo(() => {
        const map: Record<string, number> = {};
        changes.forEach((c, i) => {
            map[c.id] = i;
        });
        return map;
    }, [changes]);

    // refs for scrolling to active change
    const changeRefs = useRef<Record<string, HTMLSpanElement | null>>({});

    // Stats
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

    const reviewComplete = stats.total > 0 && stats.pending === 0;

    // Merged text
    const mergedText = useMemo(
        () => buildMergedText(blocks, decisions),
        [blocks, decisions]
    );

    // Ensure we have a valid activeIndex when there are changes
    useEffect(() => {
        if (changes.length === 0) {
            if (activeIndex !== null) setActiveIndex(null);
            return;
        }
        if (activeIndex !== null && activeIndex >= changes.length) {
            setActiveIndex(changes.length - 1);
        }
    }, [changes, activeIndex]);

    // Scroll active change into view (only after user interaction)
    useEffect(() => {
        if (activeIndex === null) return;
        const change = changes[activeIndex];
        if (!change) return;
        const el = changeRefs.current[change.id];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [activeIndex, changes]);

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

    const handleResetAll = () => {
        setDecisions({});
    };

    const handleCopyHtml = async () => {
        try {
            await navigator.clipboard.writeText(mergedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Failed to copy HTML:", err);
        }
    };

    const handleDownloadHtml = () => {
        try {
            const blob = new Blob([mergedText], {
                type: "text/html;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "merged.html";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download HTML:", err);
        }
    };

    const jumpToNextPending = () => {
        if (changes.length === 0 || stats.pending === 0) return;

        const len = changes.length;
        const start = activeIndex ?? -1;

        for (let offset = 1; offset <= len; offset++) {
            const idx = (start + offset) % len;
            const change = changes[idx];
            if (decisions[change.id] === undefined) {
                setActiveIndex(idx);
                break;
            }
        }
    };

    // Keyboard shortcuts: J/K/A/R
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return;
            }

            if (changes.length === 0) return;

            const key = e.key.toLowerCase();

            if (key === "j") {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const len = changes.length;
                    if (!len) return prev;
                    if (prev === null) return 0;
                    return (prev + 1) % len;
                });
            } else if (key === "k") {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const len = changes.length;
                    if (!len) return prev;
                    if (prev === null) return len - 1;
                    return (prev - 1 + len) % len;
                });
            } else if (key === "a") {
                e.preventDefault();
                setDecisions((prev) => {
                    const len = changes.length;
                    if (!len) return prev;
                    const idx = activeIndex ?? 0;
                    const change = changes[idx];
                    if (!change) return prev;
                    return { ...prev, [change.id]: true };
                });
                if (activeIndex === null) setActiveIndex(0);
            } else if (key === "r") {
                e.preventDefault();
                setDecisions((prev) => {
                    const len = changes.length;
                    if (!len) return prev;
                    const idx = activeIndex ?? 0;
                    const change = changes[idx];
                    if (!change) return prev;
                    return { ...prev, [change.id]: false };
                });
                if (activeIndex === null) setActiveIndex(0);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [changes, activeIndex]);

    return (
        <div className="review-layout">
            {/* Left: review changes */}
            <div className="review-panel">
                <div className="review-panel__header">
                    <div>
                        <div className="review-panel__title">Review suggestions</div>
                        <div className="review-stats">
                            <span className="review-stats__pill">Total: {stats.total}</span>
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
                            className="review-bulk-btn review-bulk-btn--next"
                            onClick={jumpToNextPending}
                            disabled={stats.pending === 0}
                        >
                            Next pending
                        </button>
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
                        <button
                            type="button"
                            className="review-bulk-btn review-bulk-btn--reset"
                            onClick={handleResetAll}
                            disabled={
                                changes.length === 0 && Object.keys(decisions).length === 0
                            }
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {reviewComplete && (
                    <div className="review-banner review-banner--success">
                        <span className="review-banner__icon">✅</span>
                        <span>
                            Review complete: all changes have been accepted or rejected.
                        </span>
                    </div>
                )}

                {/* Body: either empty state or diff + minimap */}
                {!hasChanges ? (
                    <div className="review-panel__body">
                        <EmptyState
                            variant="info"
                            title="No suggestions pending"
                            description="Original and modified HTML are identical. There’s nothing to review here."
                        />
                    </div>
                ) : (
                    <div className="review-panel__body review-panel__body--with-minimap">
                        {/* Main text area */}
                        <div className="review-body-text">
                            {blocks.map((block, idx) => {
                                if (block.kind === "text") {
                                    const text = block.text;
                                    const lines = text.split("\n");
                                    const nonEmptyLines = lines.filter(
                                        (l) => l.trim().length > 0
                                    );
                                    const lineCount = nonEmptyLines.length;

                                    const collapsible =
                                        lineCount >= 4 && text.length > 200; // heuristics
                                    const expanded = !!expandedBlocks[idx];

                                    // Collapsed pill
                                    if (collapsible && !expanded) {
                                        return (
                                            <div
                                                key={`collapsed-${idx}`}
                                                className="review-collapsed"
                                            >
                                                <button
                                                    type="button"
                                                    className="review-collapsed__btn"
                                                    onClick={() =>
                                                        setExpandedBlocks((prev) => ({
                                                            ...prev,
                                                            [idx]: true,
                                                        }))
                                                    }
                                                >
                                                    Show {lineCount} unchanged lines
                                                </button>
                                            </div>
                                        );
                                    }

                                    // Expanded / non-collapsible block
                                    if (collapsible && expanded) {
                                        return (
                                            <div
                                                key={`text-${idx}`}
                                                className="review-unchanged-block"
                                            >
                                                <button
                                                    type="button"
                                                    className="review-collapsed__btn review-collapsed__btn--inline"
                                                    onClick={() =>
                                                        setExpandedBlocks((prev) => ({
                                                            ...prev,
                                                            [idx]: false,
                                                        }))
                                                    }
                                                >
                                                    Hide unchanged lines
                                                </button>
                                                <span>{text}</span>
                                            </div>
                                        );
                                    }

                                    // Small text block: just render as-is
                                    return <span key={`text-${idx}`}>{text}</span>;
                                }

                                const { change } = block;
                                const decision = decisions[change.id];
                                const changeIdx = changeIndexMap[change.id] ?? 0;

                                return (
                                    <ChangeInline
                                        key={change.id}
                                        ref={(el) => {
                                            changeRefs.current[change.id] = el;
                                        }}
                                        change={change}
                                        decision={decision}
                                        isActive={activeIndex === changeIdx}
                                        onActivate={() => setActiveIndex(changeIdx)}
                                        onDecision={(v) => handleDecision(change.id, v)}
                                        index={changeIdx}
                                        total={changes.length}
                                    />
                                );
                            })}
                        </div>

                        {/* Minimap on the right */}
                        {changes.length > 0 && (
                            <div className="review-minimap">
                                {changes.map((change, idx) => {
                                    const decision = decisions[change.id];
                                    const top = ((idx + 0.5) / changes.length) * 100;

                                    let dotClass = "review-minimap__dot";
                                    if (decision === true)
                                        dotClass += " review-minimap__dot--accepted";
                                    else if (decision === false)
                                        dotClass += " review-minimap__dot--rejected";
                                    else dotClass += " review-minimap__dot--pending";

                                    if (activeIndex === idx) {
                                        dotClass += " review-minimap__dot--active";
                                    }

                                    return (
                                        <button
                                            key={change.id}
                                            type="button"
                                            className={dotClass}
                                            style={{ top: `${top}%` }}
                                            onClick={() => setActiveIndex(idx)}
                                            aria-label={`Jump to change ${idx + 1}`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: final merged text / HTML preview */}
            <div className="review-panel">
                <div className="review-final-header">
                    <div className="review-final-title">
                        Final result (after decisions)
                    </div>
                    <div className="review-final-toolbar">
                        <button
                            type="button"
                            className={
                                "review-toggle-btn" +
                                (showRendered ? "" : " review-toggle-btn--active")
                            }
                            onClick={() => setShowRendered(false)}
                        >
                            Raw HTML
                        </button>
                        <button
                            type="button"
                            className={
                                "review-toggle-btn" +
                                (showRendered ? " review-toggle-btn--active" : "")
                            }
                            onClick={() => setShowRendered(true)}
                        >
                            Rendered HTML
                        </button>
                        <button
                            type="button"
                            className="review-action-btn"
                            onClick={handleCopyHtml}
                        >
                            Copy HTML
                        </button>
                        <button
                            type="button"
                            className="review-action-btn"
                            onClick={handleDownloadHtml}
                        >
                            Download .html
                        </button>
                        {copied && <span className="review-copied-hint">Copied ✓</span>}
                    </div>
                </div>

                {showRendered ? (
                    <div
                        className="review-final-rendered"
                        dangerouslySetInnerHTML={{ __html: mergedText }}
                    />
                ) : (
                    <textarea className="review-final-text" value={mergedText} readOnly />
                )}
            </div>
        </div>
    );
};