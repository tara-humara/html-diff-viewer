// src/App.tsx
import React, { useState } from "react";
import { TextDiff } from "./components/TextDiff";
import type { DiffMode } from "./components/TextDiff";
import { example } from "./exampleData";

const App: React.FC = () => {
  const [mode, setMode] = useState<DiffMode>("words");

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
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
        HTML Text Diff – Level 1
      </h1>

      <p style={{ marginBottom: "16px", maxWidth: "700px", color: "#555" }}>
        This view compares two versions of a raw HTML content and highlights
        additions and deletions. Tags like {"<p>"} and {"<ul>"} are shown as
        text, not rendered.
      </p>

      {/* Controls */}
      <section
        style={{
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <label style={{ fontSize: "14px", color: "#374151" }}>
          Diff granularity:{" "}
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

      {/* Diff block */}
      <section style={{ maxWidth: "700px" }}>
        <TextDiff
          original={example.original}
          modified={example.modified}
          mode={mode}
        />
      </section>
    </main>
  );
};

export default App;