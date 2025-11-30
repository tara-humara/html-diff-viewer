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

// main menu + sub menu view types
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

// Section title with icon + pill + title text
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
  const [selectedExampleId, setSelectedExampleId] = useState<string>(
    examples[0]?.id ?? ""
  );

  // new: which top-level view and which diff view
  const [mainView, setMainView] = useState<MainView>("review-code");
  const [diffView, setDiffView] = useState<DiffView>("unified");

  const selectedExample =
    examples.find((ex) => ex.id === selectedExampleId) ?? examples[0];

  // Make sure the page starts at the top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // common card style for each panel
  const cardStyle: React.CSSProperties = {
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "16px",
    boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
  };

  // styles for main menu tabs
  const mainTabBase: React.CSSProperties = {
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
  const mainTabActive: React.CSSProperties = {
    borderColor: "#2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 600,
  };

  // styles for sub-menu tabs (inside View diff)
  const subTabBase: React.CSSProperties = {
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
        padding: "32px 32px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "var(--color-bg)",
      }}
    >
      {/* Full-width content container */}
      <div
        style={{
          width: "100%",
        }}
      >
        {/* Header */}
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
            Compare and validate AI-generated updates before merging them. Use
            the tools below to review, preview and export the final HTML.
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

            {/* Legend */}
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
                    borderRadius: "4px",
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
                    borderRadius: "4px",
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
            gap: "20px",
          }}
        >
          {/* --- NEW: main workspace menu --- */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            <button
              type="button"
              style={{
                ...mainTabBase,
                ...(mainView === "diff" ? mainTabActive : {}),
              }}
              onClick={() => setMainView("diff")}
            >
              <AdjustmentsHorizontalIcon width={18} height={18} />
              <span>View diff</span>
            </button>
            <button
              type="button"
              style={{
                ...mainTabBase,
                ...(mainView === "review-code" ? mainTabActive : {}),
              }}
              onClick={() => setMainView("review-code")}
            >
              <DocumentTextIcon width={18} height={18} />
              <span>Review code</span>
            </button>
            <button
              type="button"
              style={{
                ...mainTabBase,
                ...(mainView === "review-wysiwyg" ? mainTabActive : {}),
              }}
              onClick={() => setMainView("review-wysiwyg")}
            >
              <EyeIcon width={18} height={18} />
              <span>Review WYSIWYG</span>
            </button>
          </div>

          {/* Sub-menu for "View diff" */}
          {mainView === "diff" && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <button
                type="button"
                style={{
                  ...subTabBase,
                  ...(diffView === "unified" ? subTabActive : {}),
                }}
                onClick={() => setDiffView("unified")}
              >
                Unified text diff
              </button>
              <button
                type="button"
                style={{
                  ...subTabBase,
                  ...(diffView === "side-by-side" ? subTabActive : {}),
                }}
                onClick={() => setDiffView("side-by-side")}
              >
                Side-by-side text diff
              </button>
            </div>
          )}

          {/* REVIEW CODE (raw HTML) – previous STEP 1 */}
          {mainView === "review-code" && (
            <section style={cardStyle}>
              <SectionTitle
                step={1}
                title="Review suggestions (raw HTML)"
                icon={<DocumentTextIcon width={20} height={20} />}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "10px",
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
          )}

          {/* REVIEW WYSIWYG – previous STEP 2 */}
          {mainView === "review-wysiwyg" && (
            <section style={cardStyle}>
              <SectionTitle
                step={2}
                title="Visual HTML (WYSIWYG)"
                icon={<EyeIcon width={20} height={20} />}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                See changes in a rendered HTML document. Accept/reject inline,
                then switch to the built-in HTML preview to compare original vs
                updated.
              </p>

              <WysiwygDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
              />
            </section>
          )}

          {/* VIEW DIFF: unified – previous STEP 3 */}
          {mainView === "diff" && diffView === "unified" && (
            <section style={cardStyle}>
              <SectionTitle
                step={3}
                title="Unified text diff"
                icon={<AdjustmentsHorizontalIcon width={20} height={20} />}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Developer-oriented text diff showing all changes in a single
                block, using the granularity selected above.
              </p>

              <TextDiff
                original={selectedExample.original}
                modified={selectedExample.modified}
                mode={mode}
              />
            </section>
          )}

          {/* VIEW DIFF: side-by-side – previous STEP 4 */}
          {mainView === "diff" && diffView === "side-by-side" && (
            <section style={cardStyle}>
              <SectionTitle
                step={4}
                title="Side-by-side text diff"
                icon={<Squares2X2Icon width={20} height={20} />}
              />
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
            </section>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;