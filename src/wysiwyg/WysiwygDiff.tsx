// src/wysiwyg/WysiwygDiff.tsx
import React, { useState } from "react";
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
            let itemClass = `li-${node.status}`;

            if (decision === "accept") itemClass += " li-accepted";
            else if (decision === "reject") itemClass += " li-rejected";

            return (
                <li className={itemClass}>
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
            let itemClass = `li-${node.status}`;

            if (decision === "accept") itemClass += " li-accepted";
            else if (decision === "reject") itemClass += " li-rejected";

            const Tag: any = node.tag; // "p" or "h2"

            return (
                <div className={itemClass}>
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

    return <div className="wysiwyg-container">{renderNode(tree)}</div>;
};