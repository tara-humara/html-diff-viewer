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

/**
 * Root-level diff:
 * - Match children by index
 * - Prefer structural diff when node kinds match
 * - If they don't match, fall back to a text-only diff of both nodes
 */
function diffRoot(a: WysiwygNode, b: WysiwygNode): WysiwygNode {
    if (!isRootNode(a) || !isRootNode(b)) {
        return isRootNode(b) ? b : a;
    }

    const children: WysiwygNode[] = [];
    const maxLen = Math.max(a.children.length, b.children.length);

    for (let i = 0; i < maxLen; i++) {
        const aNode = a.children[i];
        const bNode = b.children[i];

        // Pure add
        if (!aNode && bNode) {
            children.push(markSubtree(bNode, "added", i));
            continue;
        }

        // Pure remove
        if (aNode && !bNode) {
            children.push(markSubtree(aNode, "removed", i));
            continue;
        }

        if (!aNode || !bNode) continue;

        // Both present, try structural diff
        if (isListNode(aNode) && isListNode(bNode)) {
            children.push(diffList(aNode, bNode));
        } else if (isBlockNode(aNode) && isBlockNode(bNode) && aNode.tag === bNode.tag) {
            children.push(diffBlock(aNode, bNode, i));
        } else {
            // HYBRID FALLBACK:
            // Different types or mismatched tags -> do a text-only diff of both nodes.
            children.push(diffFallbackBlock(aNode, bNode, i));
        }
    }

    return { type: "root", children };
}

/**
 * Diff between two lists (<ul>/<ol>).
 */
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
            const text = getNodeText(bNode);
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
            const text = getNodeText(aNode);
            children.push({
                type: "li",
                id,
                status: "removed",
                inlineParts: [{ value: text, removed: true }],
            });
            continue;
        }

        // Both present -> inline diff
        if (aNode && bNode && isLiNode(aNode) && isLiNode(bNode)) {
            const originalText = getNodeText(aNode);
            const modifiedText = getNodeText(bNode);

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

/**
 * Diff between two blocks (<p>/<h2>) of same tag.
 */
function diffBlock(
    a: Extract<WysiwygNode, { type: "block" }>,
    b: Extract<WysiwygNode, { type: "block" }>,
    index: number
): WysiwygNode {
    const originalText = getNodeText(a);
    const modifiedText = getNodeText(b);

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

/**
 * HYBRID FALLBACK:
 * When two nodes cannot be structurally diffed (e.g. <p> vs <ul> or <h2> vs <p>),
 * we treat them as a single logical block and run diffWords on their flattened text.
 */
function diffFallbackBlock(
    a: WysiwygNode,
    b: WysiwygNode,
    index: number
): WysiwygNode {
    const originalText = getNodeText(a);
    const modifiedText = getNodeText(b);

    const parts = diffWords(originalText, modifiedText) as InlinePart[];
    const changed = parts.some((p) => p.added || p.removed);
    const status: LiStatus = changed ? "changed" : "unchanged";

    // Prefer the tag of the "new" node if it is a block;
    // otherwise default to a <p>-like block.
    let tag: "p" | "h2" = "p";
    if (isBlockNode(b)) {
        tag = b.tag;
    } else if (isBlockNode(a)) {
        tag = a.tag;
    }

    return {
        type: "block",
        tag,
        id: `fallback-${index}`,
        status,
        inlineParts: parts,
    };
}

/**
 * Mark an entire subtree as added or removed.
 */
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
        const text = getNodeText(node);
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
        const text = getNodeText(node);
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

/**
 * Helper: flatten text for any supported node type.
 */
function getNodeText(node: WysiwygNode): string {
    if (isLiNode(node) || isBlockNode(node)) {
        return node.inlineParts.map((p) => p.value).join("");
    }

    if (isListNode(node)) {
        return node.children
            .map((child) => getNodeText(child))
            .filter(Boolean)
            .join(" ");
    }

    if (isRootNode(node)) {
        return node.children
            .map((child) => getNodeText(child))
            .filter(Boolean)
            .join(" ");
    }

    return "";
}