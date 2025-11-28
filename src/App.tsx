// src/App.tsx
import React from "react";
import { TextDiff } from "./components/TextDiff";
import { example } from "./exampleData";

const App: React.FC = () => {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#f3f4f6",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
        HTML Text Diff – Level 1
      </h1>
      <p style={{ marginBottom: "24px", maxWidth: "600px", color: "#555" }}>
        This view compares two versions of a raw HTML content and highlights
        additions and deletions. Tags like {"<p>"} and {"<ul>"} are shown as text,
        not rendered.
      </p>

      <section>
        <TextDiff original={example.original} modified={example.modified} />
      </section>
    </main>
  );
};

export default App;