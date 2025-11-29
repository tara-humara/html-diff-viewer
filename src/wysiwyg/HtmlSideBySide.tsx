// src/wysiwyg/HtmlSideBySide.tsx
import React from "react";
import "./styles.css";

export const HtmlSideBySide: React.FC<{
    original: string;
    modified: string;
}> = ({ original, modified }) => {
    return (
        <div className="wysiwyg-compare-container">
            <div className="wysiwyg-pane">
                <h3 className="wysiwyg-pane-title">Original</h3>
                <div
                    className="wysiwyg-pane-content"
                    dangerouslySetInnerHTML={{ __html: original }}
                />
            </div>

            <div className="wysiwyg-pane">
                <h3 className="wysiwyg-pane-title">Modified</h3>
                <div
                    className="wysiwyg-pane-content"
                    dangerouslySetInnerHTML={{ __html: modified }}
                />
            </div>
        </div>
    );
};