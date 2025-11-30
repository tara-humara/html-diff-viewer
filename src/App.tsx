// src/App.tsx
import React, { useState } from "react";
import { TextDiff } from "./components/TextDiff";
import type { DiffMode } from "./components/TextDiff";
import { SideBySideDiff } from "./components/SideBySideDiff";
import { ReviewableDiff } from "./components/ReviewableDiff";
import { WysiwygDiff } from "./wysiwyg/WysiwygDiff";
import { examples } from "./examples";

const App: React.FC = () => {
  const [mode, setMode] = useState<DiffMode>("words");
  const [selectedExampleId, setSelectedExampleId] = useState<string>(
    examples[0]?.id ?? ""
  );

  const selectedExample =
    examples.find((ex) => ex.id === selectedExampleId) ?? examples[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#f3f4f6",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: "16px", maxWidth: "900px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
          HTML review workspace
        </h1>
        <p style={{ marginBottom: "12px", color: "#4b5563", fontSize: "14px" }}>
          Compare and validate AI-generated updates before merging them. Use the
          tools below to review, preview and export the final HTML.
        </p>

        {/* Controls */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Example selector */}
          <label style={{ fontSize: "14px", color: "#374151" }}>
            Example:{" "}
            <select
              value={selectedExample.id}
              onChange={(e) => setSelectedExampleId(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            >
              {examples.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.label}
                </option>
              ))}
            </select>
          </label>

          {/* Diff granularity (for unified text diff) */}
          <label style={{ fontSize: "14px", color: "#374151" }}>
            Diff granularity (text diff):{" "}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as DiffMode)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            >
              <option value="chars">Characters</option>
              <option value="words">Words</option>
              <option value="lines">Lines</option>
            </select>
          </label>

          {/* Legend for text diff views */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "12px",
              color: "#4b5563",
            }}
          >
            <span>
              <span
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.3)",
                  padding: "0 4px",
                  marginRight: "4px",
                }}
              />
              Added
            </span>
            <span>
              <span
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.3)",
                  padding: "0 4px",
                  marginRight: "4px",
                }}
              />
              Removed
            </span>
          </div>
        </section>
      </header>

      {/* Main sections */}
      <section
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* 1. Review suggestions (raw HTML diff with accept/reject) */}
        <section
          style={{
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#111827",
            }}
          >
            1. Review suggestions (raw HTML)
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            Accept or reject each suggested change directly in the HTML diff.
            The panel on the right shows the merged result.
          </p>

          <ReviewableDiff
            original={selectedExample.original}
            modified={selectedExample.modified}
          />
        </section>

        {/* 2. Visual WYSIWYG HTML diff */}
        <section
          style={{
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#111827",
            }}
          >
            2. Visual HTML (WYSIWYG)
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            See changes in a rendered HTML document. Accept/reject inline, then
            switch to the built-in HTML preview to compare original vs updated.
          </p>

          <WysiwygDiff
            original={selectedExample.original}
            modified={selectedExample.modified}
          />
        </section>

        {/* 3. Advanced: unified text diff */}
        <details
          style={{
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "8px 12px 12px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            Advanced: unified text diff
          </summary>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            Developer-oriented text diff showing all changes in a single block,
            using the granularity selected above.
          </p>

          <TextDiff
            original={selectedExample.original}
            modified={selectedExample.modified}
            mode={mode}
          />
        </details>

        {/* 4. Advanced: side-by-side text diff */}
        <details
          style={{
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "8px 12px 12px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            Advanced: side-by-side text diff
          </summary>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            Original and modified HTML side by side for quick comparison.
          </p>

          <SideBySideDiff
            original={selectedExample.original}
            modified={selectedExample.modified}
          />
        </details>
      </section>
    </main>
  );
};

export default App;