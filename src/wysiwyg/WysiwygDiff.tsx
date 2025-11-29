// src/wysiwyg/WysiwygDiff.tsx
import React from "react";
import { diffHtmlTrees } from "./diff";
import type { WysiwygNode, InlinePart } from "./types";
import "./styles.css";

export type WysiwygDiffProps = {
    original: string;
    modified: string;
};

export const WysiwygDiff: React.FC<WysiwygDiffProps> = ({
    original,
    modified,
}) => {
    const tree = diffHtmlTrees(original, modified);

    if (!tree) {
        return (
            <div className="wysiwyg-container">
                No list (<code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code>) found in
                this example.
            </div>
        );
    }

    return <div className="wysiwyg-container">{renderNode(tree)}</div>;
};

function renderNode(node: WysiwygNode): React.ReactNode {
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

    if (node.type === "li") {
        return (
            <li className={`li-${node.status}`}>
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
            </li>
        );
    }

    return null;
}