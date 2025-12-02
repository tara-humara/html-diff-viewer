export type InlinePart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export type LiStatus = "unchanged" | "added" | "removed" | "changed";

/**
 * Block-level tags that we explicitly represent in the WYSIWYG tree.
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
        /**
         * Optional nested content inside this <li>, e.g. nested <ul>/<ol> or blocks.
         */
        children?: WysiwygNode[];
    }
    | {
        type: "block";
        tag: BlockTag;
        id: string;
        status: LiStatus;
        inlineParts: InlinePart[];
    };