// src/wysiwyg/WysiwygDiff.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffHtmlTrees } from "./diff";
import type { WysiwygNode, InlinePart } from "./types";
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

    // Which collapsed groups of unchanged <li> inside lists are expanded
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        {}
    );

    // Which collapsed groups of unchanged blocks (p, h1–h6) outside lists are expanded
    const [expandedBlockGroups, setExpandedBlockGroups] = useState<
        Record<string, boolean>
    >({});

    // Preview editing state
    const [isEditingPreview, setIsEditingPreview] = useState(false);
    const [editedHtml, setEditedHtml] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);

    if (!tree) {
        return <div className="wysiwyg-container">No supported HTML.</div>;
    }

    // Reset when example / inputs change
    useEffect(() => {
        setDecisions({});
        setActiveIndex(null);
        setPanelMode("review");
        setExpandedGroups({});
        setExpandedBlockGroups({});
        setIsEditingPreview(false);
        setEditedHtml(null);
    }, [original, modified]);

    const nodeHasInlineDiff = (node: WysiwygNode): boolean => {
        if (node.type !== "li" && node.type !== "block") return false;
        return node.inlineParts.some((p) => p.added || p.removed);
    };

    // Interactive = nodes with any change (status != unchanged or inline diffs)
    const interactiveIds = useMemo(() => {
        const ids: string[] = [];

        const visit = (node: WysiwygNode) => {
            if (node.type === "li" || node.type === "block") {
                const hasInline = nodeHasInlineDiff(node);
                const isChangedNode = node.status !== "unchanged" || hasInline;
                if (isChangedNode) {
                    ids.push(node.id);
                }
            }

            if (
                node.type === "root" ||
                node.type === "ul" ||
                node.type === "ol"
            ) {
                node.children.forEach(visit);
            }

            // traverse nested children inside li (e.g. nested blocks/lists)
            if (node.type === "li" && node.children) {
                node.children.forEach(visit);
            }
        };

        visit(tree);
        return ids;
    }, [tree]);

    const interactiveSet = useMemo(
        () => new Set(interactiveIds),
        [interactiveIds]
    );

    const idToIndex = useMemo(() => {
        const map: Record<string, number> = {};
        interactiveIds.forEach((id, idx) => {
            map[id] = idx;
        });
        return map;
    }, [interactiveIds]);

    const nodeRefs = useRef<Record<string, HTMLElement | null>>({});

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

    useEffect(() => {
        if (interactiveIds.length === 0) {
            if (activeIndex !== null) setActiveIndex(null);
            return;
        }
        if (activeIndex !== null && activeIndex >= interactiveIds.length) {
            setActiveIndex(interactiveIds.length - 1);
        }
    }, [interactiveIds, activeIndex]);

    // Scroll active node into view (review mode only)
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
        setExpandedGroups({});
        setExpandedBlockGroups({});
        setEditedHtml(null);
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

    // Keyboard shortcuts J/K/A/R
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

    // ----- Render helpers -----

    const renderInlineParts = (parts: InlinePart[]) =>
        parts.map((p, idx) => {
            if (p.added) {
                return (
                    <span
                        key={idx}
                        className="inline-added"
                        dangerouslySetInnerHTML={{ __html: p.value }}
                    />
                );
            }
            if (p.removed) {
                return (
                    <span
                        key={idx}
                        className="inline-removed"
                        dangerouslySetInnerHTML={{ __html: p.value }}
                    />
                );
            }
            return (
                <span
                    key={idx}
                    dangerouslySetInnerHTML={{ __html: p.value }}
                />
            );
        });

    const buildHtmlFromParts = (
        parts: InlinePart[],
        mode: "original" | "modified"
    ) =>
        parts
            .map((p) => {
                if (mode === "original") {
                    return p.added ? "" : p.value;
                }
                return p.removed ? "" : p.value;
            })
            .join("");

    /**
     * Build FINAL merged HTML (for preview) from the diff tree + decisions.
     */
    const nodeToFinalHtml = (node: WysiwygNode): string => {
        if (node.type === "root") {
            return node.children.map(nodeToFinalHtml).join("");
        }

        if (node.type === "block") {
            const decision = decisions[node.id];
            const mode: "original" | "modified" =
                decision === "accept" ? "modified" : "original";

            const html = buildHtmlFromParts(node.inlineParts, mode);
            const tag = node.tag;
            return `<${tag}>${html}</${tag}>`;
        }

        if (node.type === "ul" || node.type === "ol") {
            const tag = node.type;
            const inner = node.children.map(nodeToFinalHtml).join("");
            return `<${tag}>${inner}</${tag}>`;
        }

        if (node.type === "li") {
            const decision = decisions[node.id];
            const mode: "original" | "modified" =
                decision === "accept" ? "modified" : "original";

            const topHtml =
                node.inlineParts.length > 0
                    ? buildHtmlFromParts(node.inlineParts, mode)
                    : "";

            const childrenHtml = node.children
                ? node.children.map(nodeToFinalHtml).join("")
                : "";

            return `<li>${topHtml}${childrenHtml}</li>`;
        }

        return "";
    };

    const baseFinalHtml = useMemo(() => nodeToFinalHtml(tree), [tree, decisions]);

    // If the user has edited in preview, that wins; otherwise we use merged HTML from decisions.
    const mergedPreviewHtml = editedHtml ?? baseFinalHtml;

    // ----- Collapsing unchanged blocks outside lists -----

    const renderChildrenWithBlockCollapsing = (
        children: WysiwygNode[],
        groupPrefix: string
    ): React.ReactNode[] => {
        const out: React.ReactNode[] = [];

        const isCollapsibleBlock = (n: WysiwygNode | undefined) =>
            n &&
            n.type === "block" &&
            !interactiveSet.has(n.id) &&
            n.status === "unchanged";

        for (let i = 0; i < children.length;) {
            const child = children[i];

            if (isCollapsibleBlock(child)) {
                // collect run of consecutive blocks
                let j = i;
                while (j < children.length && isCollapsibleBlock(children[j])) j++;

                const count = j - i;

                if (count === 1) {
                    // single unchanged block -> render normally
                    out.push(
                        <React.Fragment key={`${groupPrefix}-block-${i}`}>
                            {renderNode(children[i])}
                        </React.Fragment>
                    );
                } else {
                    const groupId = `${groupPrefix}-blocks-${i}-${j}`;
                    const expanded = !!expandedBlockGroups[groupId];

                    if (!expanded) {
                        out.push(
                            <div key={groupId} className="li-collapsed">
                                <div className="li-content-row li-content-row--collapsed">
                                    <span className="li-collapsed__label">
                                        {count === 1
                                            ? "1 unchanged block hidden"
                                            : `${count} unchanged blocks hidden`}
                                    </span>
                                    {panelMode === "review" && (
                                        <button
                                            type="button"
                                            className="li-collapsed__btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedBlockGroups((prev) => ({
                                                    ...prev,
                                                    [groupId]: true,
                                                }));
                                            }}
                                        >
                                            Show
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    } else {
                        for (let k = i; k < j; k++) {
                            out.push(
                                <React.Fragment key={`${groupPrefix}-block-${k}`}>
                                    {renderNode(children[k])}
                                </React.Fragment>
                            );
                        }
                        if (panelMode === "review") {
                            out.push(
                                <div
                                    key={`${groupId}-hide`}
                                    className="li-collapsed"
                                >
                                    <div className="li-content-row">
                                        <button
                                            type="button"
                                            className="li-hide-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedBlockGroups((prev) => ({
                                                    ...prev,
                                                    [groupId]: false,
                                                }));
                                            }}
                                        >
                                            Hide unchanged
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    }
                }

                i = j;
            } else {
                out.push(
                    <React.Fragment key={`${groupPrefix}-child-${i}`}>
                        {renderNode(child)}
                    </React.Fragment>
                );
                i++;
            }
        }

        return out;
    };

    const renderNode = (node: WysiwygNode): React.ReactNode => {
        // Root
        if (node.type === "root") {
            return (
                <>
                    {renderChildrenWithBlockCollapsing(node.children, "root")}
                </>
            );
        }

        // Lists: group unchanged <li> into collapsed blocks (only when count >= 2)
        if (node.type === "ul" || node.type === "ol") {
            const Tag = node.type;
            const children = node.children;
            const out: React.ReactNode[] = [];

            const isUnchangedLi = (n: WysiwygNode | undefined) =>
                n &&
                n.type === "li" &&
                !interactiveSet.has(n.id) &&
                n.status === "unchanged";

            for (let i = 0; i < children.length;) {
                const child = children[i];

                if (isUnchangedLi(child)) {
                    // Collect run of unchanged li's
                    let j = i;
                    while (j < children.length && isUnchangedLi(children[j])) j++;

                    const count = j - i;

                    if (count === 1) {
                        // Threshold: single unchanged item is shown normally
                        out.push(
                            <React.Fragment key={`li-${i}`}>
                                {renderNode(children[i])}
                            </React.Fragment>
                        );
                    } else {
                        // 2+ unchanged items: collapsed group with Show/Hide
                        const groupId = `group-${i}-${j}`;
                        const expanded = !!expandedGroups[groupId];

                        if (!expanded) {
                            out.push(
                                <li key={groupId} className="li-collapsed">
                                    <div className="li-content-row li-content-row--collapsed">
                                        <span className="li-collapsed__label">
                                            {count === 1
                                                ? "1 unchanged item hidden"
                                                : `${count} unchanged items hidden`}
                                        </span>
                                        {panelMode === "review" && (
                                            <button
                                                type="button"
                                                className="li-collapsed__btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedGroups((prev) => ({
                                                        ...prev,
                                                        [groupId]: true,
                                                    }));
                                                }}
                                            >
                                                Show
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        } else {
                            // Expanded: show each li + a "Hide unchanged" row
                            for (let k = i; k < j; k++) {
                                out.push(
                                    <React.Fragment key={`li-${k}`}>
                                        {renderNode(children[k])}
                                    </React.Fragment>
                                );
                            }
                            if (panelMode === "review") {
                                out.push(
                                    <li key={`${groupId}-hide`} className="li-collapsed">
                                        <div className="li-content-row">
                                            <button
                                                type="button"
                                                className="li-hide-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedGroups((prev) => ({
                                                        ...prev,
                                                        [groupId]: false,
                                                    }));
                                                }}
                                            >
                                                Hide unchanged
                                            </button>
                                        </div>
                                    </li>
                                );
                            }
                        }
                    }

                    i = j;
                } else {
                    out.push(
                        <React.Fragment key={`child-${i}`}>
                            {renderNode(child)}
                        </React.Fragment>
                    );
                    i++;
                }
            }

            return <Tag>{out}</Tag>;
        }

        // Block nodes (p, h1–h6) with heading-aware rendering + badge
        if (node.type === "block") {
            const isInteractive = interactiveSet.has(node.id);
            const idx = isInteractive ? idToIndex[node.id] ?? 0 : -1;
            const isActive = isInteractive && activeIndex === idx;
            const decision = isInteractive ? decisions[node.id] : undefined;

            const Tag = node.tag as keyof React.JSX.IntrinsicElements;
            const badgeLabel = node.tag === "p" ? "P" : node.tag.toUpperCase();

            const baseClass = `li-${node.status}`;
            const activeClass = isActive ? " li-active" : "";
            const wrapperClass = `wysiwyg-block-row ${baseClass}${activeClass}`;

            // Non-interactive unchanged block visible as HTML
            if (!isInteractive) {
                const html = buildHtmlFromParts(node.inlineParts, "original");

                return (
                    <div
                        className={wrapperClass}
                        ref={(el: HTMLElement | null) => {
                            nodeRefs.current[node.id] = el;
                        }}
                    >
                        <span
                            className={`wysiwyg-block-badge wysiwyg-block-badge--${node.tag}`}
                        >
                            {badgeLabel}
                        </span>
                        <Tag
                            className="wysiwyg-block-text"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                );
            }

            const onAcceptClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                const newDecision = decision === "accept" ? undefined : "accept";
                setDecision(node.id, newDecision);
            };

            const onRejectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                const newDecision = decision === "reject" ? undefined : "reject";
                setDecision(node.id, newDecision);
            };

            // Resolved interactive block
            if (decision === "accept" || decision === "reject") {
                const html =
                    decision === "accept"
                        ? buildHtmlFromParts(node.inlineParts, "modified")
                        : buildHtmlFromParts(node.inlineParts, "original");

                return (
                    <div
                        className={wrapperClass}
                        ref={(el: HTMLElement | null) => {
                            nodeRefs.current[node.id] = el;
                        }}
                        onClick={() => setActiveIndex(idx)}
                    >
                        <span
                            className={`wysiwyg-block-badge wysiwyg-block-badge--${node.tag}`}
                        >
                            {badgeLabel}
                        </span>
                        <Tag
                            className="wysiwyg-block-text li-resolved-html"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                        <span className="li-actions">
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-accept" +
                                    (decision === "accept" ? " li-btn-active" : "")
                                }
                                onClick={onAcceptClick}
                                aria-label="Accept change"
                                title="Accept change"
                            >
                                <span className="li-btn__icon">✓</span>
                            </button>
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-reject" +
                                    (decision === "reject" ? " li-btn-active" : "")
                                }
                                onClick={onRejectClick}
                                aria-label="Reject change"
                                title="Reject change"
                            >
                                <span className="li-btn__icon">✕</span>
                            </button>
                        </span>
                    </div>
                );
            }

            // Pending interactive block
            return (
                <div
                    className={wrapperClass}
                    ref={(el: HTMLElement | null) => {
                        nodeRefs.current[node.id] = el;
                    }}
                    onClick={() => setActiveIndex(idx)}
                >
                    <span
                        className={`wysiwyg-block-badge wysiwyg-block-badge--${node.tag}`}
                    >
                        {badgeLabel}
                    </span>
                    <Tag className="wysiwyg-block-text">
                        {renderInlineParts(node.inlineParts)}
                    </Tag>
                    <span className="li-actions">
                        <button
                            type="button"
                            className={
                                "li-btn li-btn-accept" +
                                (decision === "accept" ? " li-btn-active" : "")
                            }
                            onClick={onAcceptClick}
                            aria-label="Accept change"
                            title="Accept change"
                        >
                            <span className="li-btn__icon">✓</span>
                        </button>
                        <button
                            type="button"
                            className={
                                "li-btn li-btn-reject" +
                                (decision === "reject" ? " li-btn-active" : "")
                            }
                            onClick={onRejectClick}
                            aria-label="Reject change"
                            title="Reject change"
                        >
                            <span className="li-btn__icon">✕</span>
                        </button>
                    </span>
                </div>
            );
        }

        // List items (li)
        if (node.type === "li") {
            const isInteractive = interactiveSet.has(node.id);
            const idx = isInteractive ? idToIndex[node.id] ?? 0 : -1;
            const isActive = isInteractive && activeIndex === idx;
            const decision = isInteractive ? decisions[node.id] : undefined;

            const WrapperTag: any = "li";
            const ContentTag: any = "span";

            // Non-interactive unchanged li visible as HTML
            if (!isInteractive) {
                let wrapperClass = `li-${node.status}`;
                if (isActive) wrapperClass += " li-active";

                const html = buildHtmlFromParts(node.inlineParts, "original");

                return (
                    <WrapperTag
                        className={wrapperClass}
                        ref={(el: HTMLElement | null) => {
                            nodeRefs.current[node.id] = el;
                        }}
                    >
                        <div className="li-content-row">
                            {node.inlineParts.length > 0 && (
                                <ContentTag
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            )}
                        </div>

                        {node.children && node.children.length > 0 && (
                            <div className="li-children">
                                {renderChildrenWithBlockCollapsing(
                                    node.children,
                                    `li-${node.id}`
                                )}
                            </div>
                        )}
                    </WrapperTag>
                );
            }

            const onAcceptClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                const newDecision = decision === "accept" ? undefined : "accept";
                setDecision(node.id, newDecision);
            };

            const onRejectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                const newDecision = decision === "reject" ? undefined : "reject";
                setDecision(node.id, newDecision);
            };

            // Resolved interactive li
            if (decision === "accept" || decision === "reject") {
                const html =
                    decision === "accept"
                        ? buildHtmlFromParts(node.inlineParts, "modified")
                        : buildHtmlFromParts(node.inlineParts, "original");

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
                            {node.inlineParts.length > 0 && (
                                <ContentTag
                                    className="li-resolved-html"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            )}
                            <span className="li-actions">
                                <button
                                    type="button"
                                    className={
                                        "li-btn li-btn-accept" +
                                        (decision === "accept" ? " li-btn-active" : "")
                                    }
                                    onClick={onAcceptClick}
                                    aria-label="Accept change"
                                    title="Accept change"
                                >
                                    <span className="li-btn__icon">✓</span>
                                </button>
                                <button
                                    type="button"
                                    className={
                                        "li-btn li-btn-reject" +
                                        (decision === "reject" ? " li-btn-active" : "")
                                    }
                                    onClick={onRejectClick}
                                    aria-label="Reject change"
                                    title="Reject change"
                                >
                                    <span className="li-btn__icon">✕</span>
                                </button>
                            </span>
                        </div>

                        {node.children && node.children.length > 0 && (
                            <div className="li-children">
                                {renderChildrenWithBlockCollapsing(
                                    node.children,
                                    `li-${node.id}`
                                )}
                            </div>
                        )}
                    </WrapperTag>
                );
            }

            // Pending interactive li
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
                        {node.inlineParts.length > 0 && (
                            <ContentTag>{renderInlineParts(node.inlineParts)}</ContentTag>
                        )}
                        <span className="li-actions">
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-accept" +
                                    (decision === "accept" ? " li-btn-active" : "")
                                }
                                onClick={onAcceptClick}
                                aria-label="Accept change"
                                title="Accept change"
                            >
                                <span className="li-btn__icon">✓</span>
                            </button>
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-reject" +
                                    (decision === "reject" ? " li-btn-active" : "")
                                }
                                onClick={onRejectClick}
                                aria-label="Reject change"
                                title="Reject change"
                            >
                                <span className="li-btn__icon">✕</span>
                            </button>
                        </span>
                    </div>

                    {node.children && node.children.length > 0 && (
                        <div className="li-children">
                            {renderChildrenWithBlockCollapsing(
                                node.children,
                                `li-${node.id}`
                            )}
                        </div>
                    )}
                </WrapperTag>
            );
        }

        return null;
    };

    // ----- Preview panel (click-to-edit) -----

    const togglePreviewEditing = () => {
        if (isEditingPreview) {
            // We are finishing editing: capture whatever the user typed
            if (previewRef.current) {
                const html = previewRef.current.innerHTML;
                setEditedHtml(html);
            }
        }
        // Toggle edit mode on/off
        setIsEditingPreview((prev) => !prev);
    };

    // 💾 Download final merged HTML as a file
    const handleDownloadHtml = () => {
        const html = mergedPreviewHtml || "";
        const blob = new Blob([html], {
            type: "text/html;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "reviewed.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
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

                    {panelMode === "preview" && (
                        <>
                            <span className="wysiwyg-actions-divider" />
                            <button
                                className={
                                    "wysiwyg-btn toggle" +
                                    (isEditingPreview ? " wysiwyg-btn--active" : "")
                                }
                                type="button"
                                onClick={togglePreviewEditing}
                            >
                                {isEditingPreview ? "Done editing" : "Edit final HTML"}
                            </button>
                            <button
                                className="wysiwyg-btn"
                                type="button"
                                onClick={handleDownloadHtml}
                                disabled={!mergedPreviewHtml.trim()}
                            >
                                Download HTML
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Review complete banner */}
            {panelMode === "review" && stats.pending === 0 && stats.total > 0 && (
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
                            Switch to HTML preview to check and edit the final merged
                            document.
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
                <div className="wysiwyg-preview-shell">
                    <div className="wysiwyg-preview-toolbar">
                        <span className="wysiwyg-preview-title">
                            Final HTML (merged)
                        </span>
                        <span className="wysiwyg-preview-hint">
                            {isEditingPreview
                                ? "Edit the content directly. Inline formatting is preserved."
                                : "Click 'Edit final HTML' to adjust the merged result."}
                        </span>
                    </div>
                    <div
                        ref={previewRef}
                        className={
                            "wysiwyg-preview-body" +
                            (isEditingPreview ? " wysiwyg-preview-body--editing" : "")
                        }
                        contentEditable={isEditingPreview}
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: mergedPreviewHtml }}
                    />
                </div>
            )}
        </div>
    );
};