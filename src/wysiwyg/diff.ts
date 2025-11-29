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

    return diffRoot(treeA, treeB);
}

function isRootNode(
    node: WysiwygNode
): node is Extract<WysiwygNode, { type: "root" }> {
    return node.type === "root";
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

function isBlockNode(
    node: WysiwygNode
): node is Extract<WysiwygNode, { type: "block" }> {
    return node.type === "block";
}

function diffRoot(a: WysiwygNode, b: WysiwygNode): WysiwygNode {
    if (!isRootNode(a) || !isRootNode(b)) {
        return isRootNode(b) ? b : a;
    }

    const children: WysiwygNode[] = [];
    const maxLen = Math.max(a.children.length, b.children.length);

    for (let i = 0; i < maxLen; i++) {
        const aNode = a.children[i];
        const bNode = b.children[i];

        if (!aNode && bNode) {
            children.push(markSubtree(bNode, "added", i));
            continue;
        }

        if (aNode && !bNode) {
            children.push(markSubtree(aNode, "removed", i));
            continue;
        }

        if (!aNode || !bNode) continue;

        if (isListNode(aNode) && isListNode(bNode)) {
            children.push(diffList(aNode, bNode));
        } else if (isBlockNode(aNode) && isBlockNode(bNode) && aNode.tag === bNode.tag) {
            children.push(diffBlock(aNode, bNode, i));
        } else {
            // Different kinds → treat as removed then added
            children.push(markSubtree(aNode, "removed", i));
            children.push(markSubtree(bNode, "added", i));
        }
    }

    return { type: "root", children };
}

function diffList(a: WysiwygNode, b: WysiwygNode): WysiwygNode {
    if (!isListNode(a) || !isListNode(b)) return b;

    const children: WysiwygNode[] = [];
    const maxLen = Math.max(a.children.length, b.children.length);

    for (let i = 0; i < maxLen; i++) {
        const aNode = a.children[i];
        const bNode = b.children[i];
        const id = `li-${i}`;

        // Added li
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

        // Removed li
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

        // Both present → inline diff
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

function diffBlock(
    a: Extract<WysiwygNode, { type: "block" }>,
    b: Extract<WysiwygNode, { type: "block" }>,
    index: number
): WysiwygNode {
    const originalText = a.inlineParts.map((p) => p.value).join("");
    const modifiedText = b.inlineParts.map((p) => p.value).join("");

    const parts = diffWords(originalText, modifiedText) as InlinePart[];
    const changed = parts.some((p) => p.added || p.removed);
    const status: LiStatus = changed ? "changed" : "unchanged";

    return {
        type: "block",
        tag: a.tag,
        id: `block-${index}`,
        status,
        inlineParts: parts,
    };
}

function markSubtree(
    node: WysiwygNode,
    mode: "added" | "removed",
    index: number
): WysiwygNode {
    if (isListNode(node)) {
        return {
            type: node.type,
            children: node.children.map((child) => markSubtree(child, mode, index)),
        };
    }

    if (isLiNode(node)) {
        const text = node.inlineParts.map((p) => p.value).join("");
        const part: InlinePart = { value: text };
        if (mode === "added") part.added = true;
        else part.removed = true;

        return {
            type: "li",
            id: node.id ?? `li-${index}`,
            status: mode,
            inlineParts: [part],
        };
    }

    if (isBlockNode(node)) {
        const text = node.inlineParts.map((p) => p.value).join("");
        const part: InlinePart = { value: text };
        if (mode === "added") part.added = true;
        else part.removed = true;

        return {
            type: "block",
            tag: node.tag,
            id: node.id ?? `block-${index}`,
            status: mode,
            inlineParts: [part],
        };
    }

    // root shouldn't reach here, but return as-is
    return node;
}