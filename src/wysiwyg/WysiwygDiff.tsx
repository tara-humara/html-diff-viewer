// src/wysiwyg/WysiwygDiff.tsx
import React, { useState } from "react";
import { diffHtmlTrees } from "./diff";
import type { WysiwygNode, InlinePart } from "./types";
import "./styles.css";

export type WysiwygDiffProps = {
    original: string;
    modified: string;
};

type LiDecision = "accept" | "reject" | undefined;
type Decisions = Record<string, LiDecision>;

export const WysiwygDiff: React.FC<WysiwygDiffProps> = ({
    original,
    modified,
}) => {
    const tree = diffHtmlTrees(original, modified);
    const [decisions, setDecisions] = useState<Decisions>({});

    if (!tree) {
        return (
            <div className="wysiwyg-container">
                No list (<code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code>) found in
                this example.
            </div>
        );
    }

    const handleDecision = (id: string, value: LiDecision) => {
        setDecisions((prev) => ({ ...prev, [id]: value }));
    };

    const renderNode = (node: WysiwygNode): React.ReactNode => {
        if (node.type === "ul" || node.type === "ol") {
            const Tag = node.type;
            return (
                <Tag>
                    {node.children.map((child) => (
                        <React.Fragment key={child.type === "li" ? child.id : "list"}>
                            {renderNode(child)}
                        </React.Fragment>
                    ))}
                </Tag>
            );
        }

        if (node.type === "li") {
            const decision = decisions[node.id];
            let liClass = `li-${node.status}`;

            if (decision === "accept") {
                liClass += " li-accepted";
            } else if (decision === "reject") {
                liClass += " li-rejected";
            }

            return (
                <li className={liClass}>
                    <div className="li-content-row">
                        <span>
                            {node.inlineParts.map((p: InlinePart, idx) => {
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
                            })}
                        </span>

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

        return null;
    };

    return <div className="wysiwyg-container">{renderNode(tree)}</div>;
};