// src/wysiwyg/parse.ts
import type { WysiwygNode, BlockTag } from "./types";

/**
 * Parse an HTML string into a simplified tree used by the WYSIWYG diff.
 *
 * We recursively traverse the DOM and collect "interesting" nodes in document order:
 * - <p>, <h2> → block nodes
 * - <ul>, <ol> → list nodes with <li> children
 *
 * Container elements like <div>, <section> are *not* represented explicitly
 * in the tree yet; we simply recurse into them and flatten the relevant blocks.
 */
export function parseHtmlToTree(html: string): WysiwygNode | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    let blockIndex = 0;

    const children = collectNodes(body);

    if (children.length === 0) return null;

    return {
        type: "root",
        children,
    };

    function collectNodes(el: HTMLElement): WysiwygNode[] {
        const nodes: WysiwygNode[] = [];

        const elementChildren = Array.from(el.children) as HTMLElement[];

        for (const child of elementChildren) {
            const tag = child.tagName.toLowerCase();

            if (tag === "p" || tag === "h2") {
                const blockTag = tag as BlockTag;
                const text = child.textContent ?? "";
                nodes.push({
                    type: "block",
                    tag: blockTag,
                    id: `block-${blockIndex++}`,
                    status: "unchanged",
                    inlineParts: [{ value: text }],
                });
                // continue recursion INSIDE paragraphs/headings if needed later
            } else if (tag === "ul" || tag === "ol") {
                if (child instanceof HTMLUListElement || child instanceof HTMLOListElement) {
                    nodes.push(parseListNode(child));
                }
            } else {
                // container or unknown tag: recurse into its children
                nodes.push(...collectNodes(child));
            }
        }

        return nodes;
    }

    function parseListNode(el: HTMLUListElement | HTMLOListElement): WysiwygNode {
        const listType = el.tagName.toLowerCase() as "ul" | "ol";

        const children: WysiwygNode[] = [];
        const liElements = el.querySelectorAll(":scope > li");

        liElements.forEach((li, index) => {
            const text = li.textContent ?? "";
            children.push({
                type: "li",
                id: `li-${index}`,
                status: "unchanged",
                inlineParts: [{ value: text }],
            });
        });

        return { type: listType, children };
    }
}