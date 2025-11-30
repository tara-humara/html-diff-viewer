// src/wysiwyg/WysiwygDiff.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffHtmlTrees } from "./diff";
import type { WysiwygNode, InlinePart } from "./types";
import "./styles.css";

export type WysiwygDiffProps = {
    original: string;
    modified: string;
};

type Decision = "accept" | "reject" | undefined;
type Decisions = Record<string, Decision>;

export const WysiwygDiff: React.FC<WysiwygDiffProps> = ({
    original,
    modified,
}) => {
    const tree = diffHtmlTrees(original, modified);
    const [decisions, setDecisions] = useState<Decisions>({});
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Collect all interactive nodes (blocks + li) in document order
    const interactiveIds = useMemo(() => {
        if (!tree) return [] as string[];

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

    // Refs to scroll active node into view
    const nodeRefs = useRef<Record<string, HTMLElement | null>>({});

    // Ensure we always have a valid activeIndex when there are interactive ids
    useEffect(() => {
        if (interactiveIds.length === 0) {
            if (activeIndex !== null) setActiveIndex(null);
            return;
        }

        if (activeIndex === null) {
            setActiveIndex(0);
        } else if (activeIndex >= interactiveIds.length) {
            setActiveIndex(interactiveIds.length - 1);
        }
    }, [interactiveIds, activeIndex]);

    // Scroll active node into view
    useEffect(() => {
        if (activeIndex === null) return;
        const id = interactiveIds[activeIndex];
        if (!id) return;
        const el = nodeRefs.current[id];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [activeIndex, interactiveIds]);

    if (!tree) {
        return (
            <div className="wysiwyg-container">
                No supported HTML blocks found in this example.
            </div>
        );
    }

    const handleDecision = (id: string, value: Decision) => {
        setDecisions((prev) => ({ ...prev, [id]: value }));
    };

    const renderInlineParts = (parts: InlinePart[]) => {
        return parts.map((p, idx) => {
            if (p.added) {
                return (
                    <span key={idx} className="inline-added">
                        {p.value}
                    </span>
                );
            }
            if (p.removed) {
                return (
                    <span key={idx} className="inline-removed">
                        {p.value}
                    </span>
                );
            }
            return <span key={idx}>{p.value}</span>;
        });
    };

    const renderNode = (node: WysiwygNode): React.ReactNode => {
        if (node.type === "root") {
            return (
                <>
                    {node.children.map((child, idx) => (
                        <React.Fragment key={idx}>{renderNode(child)}</React.Fragment>
                    ))}
                </>
            );
        }

        if (node.type === "ul" || node.type === "ol") {
            const Tag = node.type;
            return (
                <Tag>
                    {node.children.map((child, idx) => (
                        <React.Fragment
                            key={
                                child.type === "li" || child.type === "block" ? child.id : idx
                            }
                        >
                            {renderNode(child)}
                        </React.Fragment>
                    ))}
                </Tag>
            );
        }

        if (node.type === "li") {
            const decision = decisions[node.id];
            const idx = idToIndex[node.id] ?? 0;
            const isActive = activeIndex === idx;

            let itemClass = `li-${node.status}`;
            if (decision === "accept") itemClass += " li-accepted";
            else if (decision === "reject") itemClass += " li-rejected";
            if (isActive) itemClass += " li-active";

            return (
                <li
                    className={itemClass}
                    ref={(el) => {
                        nodeRefs.current[node.id] = el;
                    }}
                >
                    <div className="li-content-row">
                        <span>{renderInlineParts(node.inlineParts)}</span>

                        <span className="li-actions">
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-accept" +
                                    (decision === "accept" ? " li-btn-active" : "")
                                }
                                onClick={() =>
                                    handleDecision(
                                        node.id,
                                        decision === "accept" ? undefined : "accept"
                                    )
                                }
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-reject" +
                                    (decision === "reject" ? " li-btn-active" : "")
                                }
                                onClick={() =>
                                    handleDecision(
                                        node.id,
                                        decision === "reject" ? undefined : "reject"
                                    )
                                }
                            >
                                Reject
                            </button>
                        </span>
                    </div>
                </li>
            );
        }

        if (node.type === "block") {
            const decision = decisions[node.id];
            const idx = idToIndex[node.id] ?? 0;
            const isActive = activeIndex === idx;

            let itemClass = `li-${node.status}`;
            if (decision === "accept") itemClass += " li-accepted";
            else if (decision === "reject") itemClass += " li-rejected";
            if (isActive) itemClass += " li-active";

            const Tag: any = node.tag; // "p" or "h2"

            return (
                <div
                    className={itemClass}
                    ref={(el) => {
                        nodeRefs.current[node.id] = el;
                    }}
                >
                    <div className="li-content-row">
                        <Tag>{renderInlineParts(node.inlineParts)}</Tag>

                        <span className="li-actions">
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-accept" +
                                    (decision === "accept" ? " li-btn-active" : "")
                                }
                                onClick={() =>
                                    handleDecision(
                                        node.id,
                                        decision === "accept" ? undefined : "accept"
                                    )
                                }
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                className={
                                    "li-btn li-btn-reject" +
                                    (decision === "reject" ? " li-btn-active" : "")
                                }
                                onClick={() =>
                                    handleDecision(
                                        node.id,
                                        decision === "reject" ? undefined : "reject"
                                    )
                                }
                            >
                                Reject
                            </button>
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Keyboard shortcuts: J/K/A/R
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore when typing in inputs/textareas/contentEditable
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
                    const len = interactiveIds.length;
                    if (!len) return prev;
                    if (prev === null) return 0;
                    return (prev + 1) % len;
                });
            } else if (key === "k") {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const len = interactiveIds.length;
                    if (!len) return prev;
                    if (prev === null) return len - 1;
                    return (prev - 1 + len) % len;
                });
            } else if (key === "a") {
                e.preventDefault();
                setDecisions((prev) => {
                    const len = interactiveIds.length;
                    if (!len) return prev;
                    const idx = activeIndex ?? 0;
                    const id = interactiveIds[idx];
                    if (!id) return prev;
                    return { ...prev, [id]: "accept" };
                });
                if (activeIndex === null && interactiveIds.length > 0) {
                    setActiveIndex(0);
                }
            } else if (key === "r") {
                e.preventDefault();
                setDecisions((prev) => {
                    const len = interactiveIds.length;
                    if (!len) return prev;
                    const idx = activeIndex ?? 0;
                    const id = interactiveIds[idx];
                    if (!id) return prev;
                    return { ...prev, [id]: "reject" };
                });
                if (activeIndex === null && interactiveIds.length > 0) {
                    setActiveIndex(0);
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [interactiveIds, activeIndex]);

    return <div className="wysiwyg-container">{renderNode(tree)}</div>;
};