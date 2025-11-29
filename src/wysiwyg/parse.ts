// src/wysiwyg/parse.ts
import type { WysiwygNode, BlockTag } from "./types";

export function parseHtmlToTree(html: string): WysiwygNode | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    const children: WysiwygNode[] = [];
    let blockIndex = 0;

    const elementChildren = Array.from(body.children) as HTMLElement[];

    for (const el of elementChildren) {
        const tag = el.tagName.toLowerCase();

        if (tag === "ul" || tag === "ol") {
            if (el instanceof HTMLUListElement || el instanceof HTMLOListElement) {
                children.push(parseListNode(el));
            }
        } else if (tag === "p" || tag === "h2") {
            const blockTag = tag as BlockTag;
            const text = el.textContent ?? "";
            children.push({
                type: "block",
                tag: blockTag,
                id: `block-${blockIndex++}`,
                status: "unchanged",
                inlineParts: [{ value: text }],
            });
        } else {
            // ignore other tags for now
        }
    }

    if (children.length === 0) return null;

    return { type: "root", children };
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