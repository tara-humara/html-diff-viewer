export type InlinePart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type LiStatus = "unchanged" | "added" | "removed" | "changed";

/**
 * Block-level tags that we explicitly represent in the WYSIWYG tree.
 *
 * We support paragraphs and all headings out of the box.
 * Layout containers like <div>, <section>, <article> are treated as
 * containers in parseHtmlToTree and only turned into blocks as a fallback.
 */
export type BlockTag =
    | "p"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";

export type WysiwygNode =
    | {
        type: "root";
        children: WysiwygNode[];
    }
    | {
        type: "ul" | "ol";
        children: WysiwygNode[];
    }
    | {
        type: "li";
        id: string;
        status: LiStatus;
        inlineParts: InlinePart[];
    }
    | {
        type: "block";
        tag: BlockTag;
        id: string;
        status: LiStatus;
        inlineParts: InlinePart[];
    };