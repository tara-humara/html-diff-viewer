// src/wysiwyg/WysiwygDiff.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffHtmlTrees } from "./diff";
import type { WysiwygNode, InlinePart } from "./types";
import { HtmlSideBySide } from "./HtmlSideBySide";
import { EmptyState } from "../components/EmptyState";
import "./styles.css";

export type WysiwygDiffProps = {
    original: string;
    modified: string;
};

type Decision = "accept" | "reject" | undefined;
type Decisions = Record<string, Decision>;
type PanelMode = "review" | "preview";

export const WysiwygDiff: React.FC<WysiwygDiffProps> = ({
    original,
    modified,
}) => {
    const tree = diffHtmlTrees(original, modified);
    const [decisions, setDecisions] = useState<Decisions>({});
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [panelMode, setPanelMode] = useState<PanelMode>("review");

    if (!tree) {
        return <div className="wysiwyg-container">No supported HTML.</div>;
    }

    // Collect all interactive nodes (blocks + li) in document order
    const interactiveIds = useMemo(() => {
        const ids: string[] = [];

        const visit = (node: WysiwygNode) => {
            if (node.type === "li" || node.type === "block") {
                ids.push(node.id);
            } else if (
                node.type === "root" ||
                node.type === "ul" ||
                node.type === "ol"
            ) {
                node.children.forEach(visit);
            }
        };

        visit(tree);
        return ids;
    }, [tree]);

    // Map id -> index
    const idToIndex = useMemo(() => {
        const map: Record<string, number> = {};
        interactiveIds.forEach((id, idx) => {
            map[id] = idx;
        });
        return map;
    }, [interactiveIds]);

    // Refs for scroll-to-active
    const nodeRefs = useRef<Record<string, HTMLElement | null>>({});

    // Stats
    const stats = useMemo(() => {
        const total = interactiveIds.length;
        let accepted = 0;
        let rejected = 0;

        interactiveIds.forEach((id) => {
            const d = decisions[id];
            if (d === "accept") accepted++;
            else if (d === "reject") rejected++;
        });

        const pending = total - accepted - rejected;
        return { total, accepted, rejected, pending };
    }, [interactiveIds, decisions]);

    // Ensure activeIndex is valid, but don't auto-select the first one
    useEffect(() => {
        if (interactiveIds.length === 0) {
            if (activeIndex !== null) setActiveIndex(null);
            return;
        }

        if (activeIndex !== null && activeIndex >= interactiveIds.length) {
            setActiveIndex(interactiveIds.length - 1);
        }
    }, [interactiveIds, activeIndex]);

    // Scroll active node into view (review mode only, after user interaction)
    useEffect(() => {
        if (panelMode !== "review") return;
        if (activeIndex === null) return;
        const id = interactiveIds[activeIndex];
        if (!id) return;
        const el = nodeRefs.current[id];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [activeIndex, interactiveIds, panelMode]);

    // Decision helpers
    const setDecision = (id: string, value: Decision) => {
        setDecisions((prev) => ({ ...prev, [id]: value }));
    };

    const handleBulk = (mode: "accept" | "reject") => {
        setDecisions(() => {
            const out: Decisions = {};
            interactiveIds.forEach((id) => {
                out[id] = mode;
            });
            return out;
        });
    };

    const handleReset = () => {
        setDecisions({});
    };

    const jumpToNextPending = () => {
        if (stats.pending === 0) return;

        const len = interactiveIds.length;
        const start = activeIndex ?? -1;

        for (let offset = 1; offset <= len; offset++) {
            const idx = (start + offset) % len;
            const id = interactiveIds[idx];
            if (decisions[id] === undefined) {
                setActiveIndex(idx);
                return;
            }
        }
    };

    // Keyboard shortcuts J/K/A/R (only in review mode)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (panelMode !== "review") return;

            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return;
            }

            if (interactiveIds.length === 0) return;

            const key = e.key.toLowerCase();

            if (key === "j") {
                e.preventDefault();
                setActiveIndex((prev) => {
                    if (prev === null) return 0;
                    return (prev + 1) % interactiveIds.length;
                });
            } else if (key === "k") {
                e.preventDefault();
                setActiveIndex((prev) => {
                    if (prev === null) return interactiveIds.length - 1;
                    return (prev - 1 + interactiveIds.length) % interactiveIds.length;
                });
            } else if (key === "a") {
                e.preventDefault();
                if (activeIndex === null) return;
                setDecision(interactiveIds[activeIndex], "accept");
            } else if (key === "r") {
                e.preventDefault();
                if (activeIndex === null) return;
                setDecision(interactiveIds[activeIndex], "reject");
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [interactiveIds, activeIndex, panelMode]);

    // Render helpers
    const renderInlineParts = (parts: InlinePart[]) =>
        parts.map((p, idx) => {
            if (p.added)
                return (
                    <span key={idx} className="inline-added">
                        {p.value}
                    </span>
                );
            if (p.removed)
                return (
                    <span key={idx} className="inline-removed">
                        {p.value}
                    </span>
                );
            return <span key={idx}>{p.value}</span>;
        });

    // Build original / modified text from diff parts
    const buildTextFromParts = (
        parts: InlinePart[],
        mode: "original" | "modified"
    ) => {
        return parts
            .map((p) => {
                if (mode === "original") {
                    // original text = unchanged + removed segments (skip added-only)
                    return p.added ? "" : p.value;
                }
                // modified text = unchanged + added segments (skip removed-only)
                return p.removed ? "" : p.value;
            })
            .join("");
    };

    const renderNode = (node: WysiwygNode): React.ReactNode => {
        if (node.type === "root") {
            return (
                <>
                    {node.children.map((child, i) => (
                        <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                </>
            );
        }

        if (node.type === "ul" || node.type === "ol") {
            const Tag = node.type;
            return (
                <Tag>
                    {node.children.map((child, i) => (
                        <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                </Tag>
            );
        }

        if (node.type === "li" || node.type === "block") {
            const idx = idToIndex[node.id] ?? 0;
            const isActive = activeIndex === idx;
            const decision = decisions[node.id];

            const WrapperTag: any = node.type === "block" ? "div" : "li";
            const ContentTag: any = node.type === "block" ? node.tag : "span";

            // --- Resolved state: show final text with no diff colours ---
            if (decision === "accept" || decision === "reject") {
                const finalText =
                    decision === "accept"
                        ? buildTextFromParts(node.inlineParts, "modified")
                        : buildTextFromParts(node.inlineParts, "original");

                let wrapperClass = "li-resolved";
                if (isActive) wrapperClass += " li-active";

                return (
                    <WrapperTag
                        className={wrapperClass}
                        ref={(el: HTMLElement | null) => {
                            nodeRefs.current[node.id] = el;
                        }}
                        onClick={() => setActiveIndex(idx)}
                    >
                        <div className="li-content-row">
                            <ContentTag className="li-resolved-html">{finalText}</ContentTag>
                            <span className="li-actions">
                                <button
                                    type="button"
                                    className={
                                        "li-btn li-btn-accept" +
                                        (decision === "accept" ? " li-btn-active" : "")
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDecision(
                                            node.id,
                                            decision === "accept" ? undefined : "accept"
                                        );
                                    }}
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    className={
                                        "li-btn li-btn-reject" +
                                        (decision === "reject" ? " li-btn-active" : "")
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDecision(
                                            node.id,
                                            decision === "reject" ? undefined : "reject"
                                        );
                                    }}
                                >
                                    Reject
                                </button>
                            </span>
                        </div>
                    </WrapperTag>
                );
            }

            // --- Pending state: show full diff with rails + inline highlights ---
            let itemClass = `li-${node.status}`;
            if (isActive) itemClass += " li-active";

            return (
                <WrapperTag
                    className={itemClass}
                    ref={(el: HTMLElement | null) => {
                        nodeRefs.current[node.id] = el;
                    }}
                    onClick={() => setActiveIndex(idx)}
                >
                    <div className="li-content-row">
                        <ContentTag>{renderInlineParts(node.inlineParts)}</ContentTag>

                        <span className="li-actions">
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-accept" +
                                    (decision === "accept" ? " li-btn-active" : "")
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDecision(
                                        node.id,
                                        decision === "accept" ? undefined : "accept"
                                    );
                                }}
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-reject" +
                                    (decision === "reject" ? " li-btn-active" : "")
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDecision(
                                        node.id,
                                        decision === "reject" ? undefined : "reject"
                                    );
                                }}
                            >
                                Reject
                            </button>
                        </span>
                    </div>
                </WrapperTag>
            );
        }

        return null;
    };

    return (
        <div className="wysiwyg-container">
            {/* Toolbar */}
            <div className="wysiwyg-toolbar">
                <div className="wysiwyg-stats">
                    <span className="pill">Total: {stats.total}</span>
                    <span className="pill pill-accepted">
                        Accepted: {stats.accepted}
                    </span>
                    <span className="pill pill-rejected">
                        Rejected: {stats.rejected}
                    </span>
                    <span className="pill pill-pending">
                        Pending: {stats.pending}
                    </span>
                </div>

                <div className="wysiwyg-actions">
                    {/* Mode toggle */}
                    <button
                        className={
                            "wysiwyg-btn toggle" +
                            (panelMode === "review" ? " wysiwyg-btn--active" : "")
                        }
                        type="button"
                        onClick={() => setPanelMode("review")}
                    >
                        Review
                    </button>
                    <button
                        className={
                            "wysiwyg-btn toggle" +
                            (panelMode === "preview" ? " wysiwyg-btn--active" : "")
                        }
                        type="button"
                        onClick={() => setPanelMode("preview")}
                    >
                        HTML preview
                    </button>

                    {panelMode === "review" && (
                        <>
                            <span className="wysiwyg-actions-divider" />
                            <button
                                className="wysiwyg-btn next"
                                onClick={jumpToNextPending}
                                disabled={stats.pending === 0}
                            >
                                Next pending
                            </button>
                            <button
                                className="wysiwyg-btn accept"
                                onClick={() => handleBulk("accept")}
                                disabled={stats.total === 0}
                            >
                                Accept all
                            </button>
                            <button
                                className="wysiwyg-btn reject"
                                onClick={() => handleBulk("reject")}
                                disabled={stats.total === 0}
                            >
                                Reject all
                            </button>
                            <button
                                className="wysiwyg-btn reset"
                                onClick={handleReset}
                                disabled={stats.total === 0}
                            >
                                Reset
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Review complete banner */}
            {stats.pending === 0 && stats.total > 0 && (
                <div className="wysiwyg-banner wysiwyg-banner--success">
                    <span className="wysiwyg-banner__icon">✔</span>
                    <span>
                        <span
                            style={{
                                display: "block",
                                fontWeight: 600,
                            }}
                        >
                            Review complete: all changes have been accepted or rejected.
                        </span>
                        <span
                            style={{
                                display: "block",
                                fontSize: "12px",
                                color: "#166534",
                                marginTop: "2px",
                            }}
                        >
                            Switch to HTML preview to check the final merged document.
                        </span>
                    </span>
                </div>
            )}

            {/* Content */}
            {panelMode === "review" ? (
                stats.total === 0 ? (
                    <EmptyState
                        variant="info"
                        title="No suggestions pending"
                        description="Original and modified HTML are identical. Switch to HTML preview to see the rendered document."
                    />
                ) : (
                    <div className="wysiwyg-content-wrapper">
                        <div className="wysiwyg-content">{renderNode(tree)}</div>

                        {interactiveIds.length > 0 && (
                            <div className="wysiwyg-minimap">
                                {interactiveIds.map((id, idx) => {
                                    const decision = decisions[id];
                                    const top =
                                        ((idx + 0.5) / interactiveIds.length) * 100;

                                    let dotClass = "wysiwyg-minimap__dot";
                                    if (decision === "accept") {
                                        dotClass += " wysiwyg-minimap__dot--accepted";
                                    } else if (decision === "reject") {
                                        dotClass += " wysiwyg-minimap__dot--rejected";
                                    } else {
                                        dotClass += " wysiwyg-minimap__dot--pending";
                                    }

                                    if (activeIndex === idx) {
                                        dotClass += " wysiwyg-minimap__dot--active";
                                    }

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={dotClass}
                                            style={{ top: `${top}%` }}
                                            onClick={() => setActiveIndex(idx)}
                                            aria-label={`Jump to block ${idx + 1}`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            ) : (
                <HtmlSideBySide original={original} modified={modified} />
            )}
        </div>
    );
};