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
 *
 * IMPORTANT: inlineParts.value holds HTML (innerHTML), not plain text,
 * so we can preserve inline formatting like <strong>, <em>, <a>, etc.
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
                    inlineParts: [{ value: escapeHtml(fallbackText) }],
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
                // Store innerHTML so we keep <strong>, <em>, <a>, etc.
                const html = (child.innerHTML ?? "").trim();
                if (html) {
                    nodes.push(makeBlockNode(html, tag as BlockTag));
                }
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
                    // Otherwise, fall back to treating the container's HTML/text as a block.
                    const html = (child.innerHTML ?? "").trim();
                    if (html) {
                        nodes.push(makeBlockNode(html, "p"));
                    }
                }
                continue;
            }

            // Other/unknown tags: just recurse into their children.
            nodes.push(...collectNodes(child));
        }

        return nodes;
    }

    /**
     * Parse a <ul> or <ol> into a list node with li children.
     * Each <li> gets:
     *   - inlineParts: top-level HTML in the <li> (excluding nested <ul>/<ol>)
     *   - children: nested blocks/lists inside the <li> (if any)
     */
    function parseListNode(el: HTMLUListElement | HTMLOListElement): WysiwygNode {
        const listType = el.tagName.toLowerCase() as "ul" | "ol";

        const children: WysiwygNode[] = [];
        const liElements = el.querySelectorAll(":scope > li");

        liElements.forEach((li, index) => {
            const liElement = li as HTMLElement;

            // Clone the <li> and remove nested lists from the clone
            // to get only the "top" content as inline HTML.
            const clone = liElement.cloneNode(true) as HTMLElement;
            clone.querySelectorAll("ul,ol").forEach((nested) => nested.remove());
            const topHtml = (clone.innerHTML ?? "").trim();

            // Now parse nested blocks/lists inside the original <li>
            const nestedChildren = collectNodes(liElement);

            // If there's no top content but there are nested nodes, we still
            // create a li node with empty inlineParts and children.
            if (!topHtml && nestedChildren.length === 0) {
                return;
            }

            children.push({
                type: "li",
                id: `li-${index}`,
                status: "unchanged",
                inlineParts: topHtml ? [{ value: topHtml }] : [],
                children: nestedChildren.length > 0 ? nestedChildren : undefined,
            });
        });

        return { type: listType, children };
    }

    function makeBlockNode(html: string, tag: BlockTag): WysiwygNode {
        return {
            type: "block",
            tag,
            id: `block-${blockIndex++}`,
            status: "unchanged",
            // value is HTML; we render with dangerouslySetInnerHTML
            inlineParts: [{ value: html }],
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

    /**
     * Simple HTML escape used only for the fallback "body text as a single block"
     * case, where we had only textContent and want to keep it safe.
     */
    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}