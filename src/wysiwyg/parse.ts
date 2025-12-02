// src/wysiwyg/parse.ts
import type { WysiwygNode, BlockTag } from "./types";

/**
 * Parse an HTML string into a simplified tree used by the WYSIWYG diff.
 *
 * We recursively traverse the DOM and collect "interesting" nodes in document order:
 * - <p>, <h1>–<h6>        → block nodes
 * - <ul>, <ol>            → list nodes with <li> children
 *
 * Layout containers like <div>, <section>, <article> are usually treated
 * as pure containers (we recurse into them). If they don't contain any
 * supported blocks or lists, we fall back to treating their text content
 * as a single paragraph block. This helps with "all-div" HTML.
 */
export function parseHtmlToTree(html: string): WysiwygNode | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    let blockIndex = 0;

    const children = collectNodes(body);

    // If we didn't find any explicit blocks/lists, but there is text content,
    // fall back to a single paragraph block representing the whole body.
    if (children.length === 0) {
        const fallbackText = (body.textContent ?? "").trim();
        if (!fallbackText) {
            return null;
        }

        return {
            type: "root",
            children: [
                {
                    type: "block",
                    tag: "p",
                    id: "block-0",
                    status: "unchanged",
                    inlineParts: [{ value: fallbackText }],
                },
            ],
        };
    }

    return {
        type: "root",
        children,
    };

    /**
     * Collect WysiwygNodes from an element's children in document order.
     */
    function collectNodes(el: HTMLElement): WysiwygNode[] {
        const nodes: WysiwygNode[] = [];
        const elementChildren = Array.from(el.children) as HTMLElement[];

        for (const child of elementChildren) {
            const tag = child.tagName.toLowerCase();

            // Primary block tags: paragraphs + all headings
            if (isBlockTag(tag)) {
                const text = child.textContent ?? "";
                const trimmed = text.trim();
                if (trimmed) {
                    nodes.push(makeBlockNode(trimmed, tag as BlockTag));
                }
                // If needed in the future, you could still recurse inside here.
                continue;
            }

            // Lists: <ul>, <ol>
            if (tag === "ul" || tag === "ol") {
                if (child instanceof HTMLUListElement || child instanceof HTMLOListElement) {
                    nodes.push(parseListNode(child));
                }
                continue;
            }

            // Layout containers: <div>, <section>, <article>
            if (isLayoutContainer(tag)) {
                // First, try to collect any nested blocks/lists.
                const nested = collectNodes(child);

                if (nested.length > 0) {
                    // If the container holds supported content, just use that.
                    nodes.push(...nested);
                } else {
                    // Otherwise, fall back to treating the container's text as a block.
                    const text = (child.textContent ?? "").trim();
                    if (text) {
                        nodes.push(makeBlockNode(text, "p"));
                    }
                }
                continue;
            }

            // Other/unknown tags: just recurse into their children.
            nodes.push(...collectNodes(child));
        }

        return nodes;
    }

    function parseListNode(el: HTMLUListElement | HTMLOListElement): WysiwygNode {
        const listType = el.tagName.toLowerCase() as "ul" | "ol";

        const children: WysiwygNode[] = [];
        const liElements = el.querySelectorAll(":scope > li");

        liElements.forEach((li, index) => {
            const text = li.textContent ?? "";
            const trimmed = text.trim();
            if (!trimmed) {
                return;
            }

            children.push({
                type: "li",
                id: `li-${index}`,
                status: "unchanged",
                inlineParts: [{ value: trimmed }],
            });
        });

        return { type: listType, children };
    }

    function makeBlockNode(text: string, tag: BlockTag): WysiwygNode {
        return {
            type: "block",
            tag,
            id: `block-${blockIndex++}`,
            status: "unchanged",
            inlineParts: [{ value: text }],
        };
    }

    function isBlockTag(tag: string): tag is BlockTag {
        return (
            tag === "p" ||
            tag === "h1" ||
            tag === "h2" ||
            tag === "h3" ||
            tag === "h4" ||
            tag === "h5" ||
            tag === "h6"
        );
    }

    function isLayoutContainer(tag: string): boolean {
        return tag === "div" || tag === "section" || tag === "article";
    }
}