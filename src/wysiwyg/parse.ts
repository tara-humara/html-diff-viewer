// src/wysiwyg/parse.ts
import type { WysiwygNode } from "./types";

export function parseHtmlToTree(html: string): WysiwygNode | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const el = doc.body.querySelector("ul, ol");
    if (!el) return null;

    if (el instanceof HTMLUListElement || el instanceof HTMLOListElement) {
        return parseListNode(el);
    }

    return null;
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