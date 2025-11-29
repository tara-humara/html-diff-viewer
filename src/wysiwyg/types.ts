// src/wysiwyg/types.ts

export type InlinePart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type LiStatus = "unchanged" | "added" | "removed" | "changed";

export type WysiwygNode =
    | {
        type: "ul" | "ol";
        children: WysiwygNode[];
    }
    | {
        type: "li";
        status: LiStatus;
        inlineParts: InlinePart[];
    };