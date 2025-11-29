// src/wysiwyg/diff.ts
import { diffWords } from "diff";
import type { WysiwygNode, InlinePart, LiStatus } from "./types";
import { parseHtmlToTree } from "./parse";

export function diffHtmlTrees(
    original: string,
    modified: string
): WysiwygNode | null {
    const treeA = parseHtmlToTree(original);
    const treeB = parseHtmlToTree(modified);

    if (!treeA || !treeB) return null;

    return diffList(treeA, treeB);
}

function isListNode(
    node: WysiwygNode
): node is Extract<WysiwygNode, { type: "ul" | "ol" }> {
    return node.type === "ul" || node.type === "ol";
}

function isLiNode(
    node: WysiwygNode
): node is Extract<WysiwygNode, { type: "li" }> {
    return node.type === "li";
}

function diffList(a: WysiwygNode, b: WysiwygNode): WysiwygNode {
    if (!isListNode(a) || !isListNode(b)) {
        // Fallback: just return the modified tree if types don't match
        return b;
    }

    const children: WysiwygNode[] = [];
    const maxLen = Math.max(a.children.length, b.children.length);

    for (let i = 0; i < maxLen; i++) {
        const aNode = a.children[i];
        const bNode = b.children[i];
        const id = `li-${i}`;

        // Added line
        if (!aNode && bNode && isLiNode(bNode)) {
            const text = bNode.inlineParts.map((p) => p.value).join("");
            children.push({
                type: "li",
                id,
                status: "added",
                inlineParts: [{ value: text, added: true }],
            });
            continue;
        }

        // Removed line
        if (aNode && !bNode && isLiNode(aNode)) {
            const text = aNode.inlineParts.map((p) => p.value).join("");
            children.push({
                type: "li",
                id,
                status: "removed",
                inlineParts: [{ value: text, removed: true }],
            });
            continue;
        }

        // Both lines present: compare text content
        if (aNode && bNode && isLiNode(aNode) && isLiNode(bNode)) {
            const originalText = aNode.inlineParts.map((p) => p.value).join("");
            const modifiedText = bNode.inlineParts.map((p) => p.value).join("");

            const parts = diffWords(originalText, modifiedText) as InlinePart[];
            const changed = parts.some((p) => p.added || p.removed);
            const status: LiStatus = changed ? "changed" : "unchanged";

            children.push({
                type: "li",
                id,
                status,
                inlineParts: parts,
            });
        }
    }

    return {
        type: a.type,
        children,
    };
}