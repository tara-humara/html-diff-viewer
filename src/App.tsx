// src/App.tsx
import React, { useState, useEffect } from "react";
import { TextDiff } from "./components/TextDiff";
import type { DiffMode } from "./components/TextDiff";
import { SideBySideDiff } from "./components/SideBySideDiff";
import { ReviewableDiff } from "./components/ReviewableDiff";
import { WysiwygDiff } from "./wysiwyg/WysiwygDiff";
import { examples } from "./examples";

// Heroicons
import {
  DocumentTextIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

// main menu + sub menu types
type MainView = "diff" | "review-code" | "review-wysiwyg";
type DiffView = "unified" | "side-by-side";

// Small pill showing "Step X"
const StepPill: React.FC<{ step: number }> = ({ step }) => (
  <span
    style={{
      background: "#0b2e4e22",
      color: "#0b2e4e",
      fontSize: "11px",
      fontWeight: 600,
      padding: "2px 6px",
      borderRadius: "999px",
      marginRight: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}
  >
    Step {step}
  </span>
);

// Section title with icon + step + text
const SectionTitle: React.FC<{
  step: number;
  title: string;
  icon: React.ReactNode;
}> = ({ step, title, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "6px",
    }}
  >
    <div
      style={{
        width: "20px",
        height: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0b2e4e",
      }}
    >
      {icon}
    </div>
    <StepPill step={step} />
    <h2
      style={{
        fontSize: "18px",
        fontWeight: 700,
        color: "#0b2e4e",
        margin: 0,
      }}
    >
      {title}
    </h2>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<DiffMode>("words");
  const [selectedExampleId, setSelectedExampleId] = useState(
    examples[0]?.id ?? ""
  );

  const [mainView, setMainView] = useState<MainView>("review-code");
  const [diffView, setDiffView] = useState<DiffView>("unified");

  const selectedExample =
    examples.find((ex) => ex.id === selectedExampleId) ?? examples[0];

  useEffect(() => window.scrollTo(0, 0), []);

  // Shared card style
  const cardStyle: React.CSSProperties = {
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "16px",
    boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
  };

  // Main tabs
  const tabBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "999px",
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };
  const tabActive: React.CSSProperties = {
    borderColor: "#2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 600,
  };

  // Sub-tabs (inside "View diff")
  const subTab: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "13px",
    color: "#4b5563",
  };
  const subTabActive: React.CSSProperties = {
    borderColor: "#6b7280",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: 500,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ width: "100%" }}>
        {/* HEADER */}
        <header style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "26px",
              marginBottom: "8px",
              color: "#0b2e4e",
              fontWeight: 700,
            }}
          >
            HTML review workspace
          </h1>

          <p
            style={{
              marginBottom: "14px",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Compare and validate AI-generated updates before merging them.
          </p>

          {/* Example + granularity */}
          <section
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
            }}
          >
            {/* Example selector */}
            <label
              style={{
                fontSize: "14px",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Example:{" "}
              <select
                value={selectedExample.id}
                onChange={(e) => setSelectedExampleId(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
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

            {/* Diff granularity */}
            <label
              style={{
                fontSize: "14px",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Diff granularity (text diff):{" "}
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as DiffMode)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              >
                <option value="chars">Characters</option>
                <option value="words">Words</option>
                <option value="lines">Lines</option>
              </select>
            </label>
          </section>
        </header>

        {/* WORKSPACE SECTIONS */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "100%",
          }}
        >
          {/* MAIN MENU */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            <button
              type="button"
              style={{ ...tabBase, ...(mainView === "diff" ? tabActive : {}) }}
              onClick={() => setMainView("diff")}
            >
              <AdjustmentsHorizontalIcon width={18} height={18} />
              View diff
            </button>

            <button
              type="button"
              style={{
                ...tabBase,
                ...(mainView === "review-code" ? tabActive : {}),
              }}
              onClick={() => setMainView("review-code")}
            >
              <DocumentTextIcon width={18} height={18} />
              Review code
            </button>

            <button
              type="button"
              style={{
                ...tabBase,
                ...(mainView === "review-wysiwyg" ? tabActive : {}),
              }}
              onClick={() => setMainView("review-wysiwyg")}
            >
              <EyeIcon width={18} height={18} />
              Review WYSIWYG
            </button>
          </div>

          {/* SUB-MENU: only for "View diff" */}
          {mainView === "diff" && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <button
                type="button"
                style={{
                  ...subTab,
                  ...(diffView === "unified" ? subTabActive : {}),
                }}
                onClick={() => setDiffView("unified")}
              >
                Unified text diff
              </button>

              <button
                type="button"
                style={{
                  ...subTab,
                  ...(diffView === "side-by-side" ? subTabActive : {}),
                }}
                onClick={() => setDiffView("side-by-side")}
              >
                Side-by-side text diff
              </button>
            </div>
          )}

          {/* REVIEW CODE */}
          {mainView === "review-code" && (
            <section style={cardStyle}>
              <SectionTitle
                step={1}
                title="Review suggestions (raw HTML)"
                icon={<DocumentTextIcon width={20} height={20} />}
              />

              <ReviewableDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
              />
            </section>
          )}

          {/* REVIEW WYSIWYG */}
          {mainView === "review-wysiwyg" && (
            <section style={cardStyle}>
              <SectionTitle
                step={2}
                title="Visual HTML (WYSIWYG)"
                icon={<EyeIcon width={20} height={20} />}
              />

              <WysiwygDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
              />
            </section>
          )}

          {/* UNIFIED TEXT DIFF */}
          {mainView === "diff" && diffView === "unified" && (
            <section style={cardStyle}>
              <SectionTitle
                step={3}
                title="Unified text diff"
                icon={<AdjustmentsHorizontalIcon width={20} height={20} />}
              />

              <TextDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
                mode={mode}
              />
            </section>
          )}

          {/* SIDE-BY-SIDE TEXT DIFF */}
          {mainView === "diff" && diffView === "side-by-side" && (
            <section style={cardStyle}>
              <SectionTitle
                step={4}
                title="Side-by-side text diff"
                icon={<Squares2X2Icon width={20} height={20} />}
              />

              <SideBySideDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
                mode={mode}   // ★ granularity passed
              />
            </section>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;