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
type InputMode = "example" | "files";

// Section title with icon + text
const SectionTitle: React.FC<{
  title: string;
  icon: React.ReactNode;
}> = ({ title, icon }) => (
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

  // input source state
  const [inputMode, setInputMode] = useState<InputMode>("example");
  const [selectedExampleId, setSelectedExampleId] = useState(
    examples[0]?.id ?? ""
  );

  const [fileOriginalName, setFileOriginalName] = useState("");
  const [fileModifiedName, setFileModifiedName] = useState("");
  const [fileOriginalText, setFileOriginalText] = useState("");
  const [fileModifiedText, setFileModifiedText] = useState("");

  // view state
  const [mainView, setMainView] = useState<MainView>("review-code");
  const [diffView, setDiffView] = useState<DiffView>("unified");

  const selectedExample =
    examples.find((ex) => ex.id === selectedExampleId) ?? examples[0];

  // effective HTML that flows into all tools
  const originalHtml =
    inputMode === "example" ? selectedExample.original : fileOriginalText;
  const modifiedHtml =
    inputMode === "example" ? selectedExample.modified : fileModifiedText;

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

  // file handlers
  const handleFileChange =
    (kind: "original" | "modified") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = String(ev.target?.result ?? "");
          if (kind === "original") {
            setFileOriginalText(text);
            setFileOriginalName(file.name);
          } else {
            setFileModifiedText(text);
            setFileModifiedName(file.name);
          }
        };
        reader.readAsText(file);
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

          {/* Input source + controls */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Input source toggle */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                Input source:
              </span>

              <label
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="input-mode"
                  value="example"
                  checked={inputMode === "example"}
                  onChange={() => setInputMode("example")}
                />
                Examples
              </label>

              <label
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="input-mode"
                  value="files"
                  checked={inputMode === "files"}
                  onChange={() => setInputMode("files")}
                />
                Upload files
              </label>
            </div>

            {/* Example selector OR file inputs */}
            {inputMode === "example" ? (
              <label
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                Input text:
                <select
                  value={selectedExample.id}
                  onChange={(e) => setSelectedExampleId(e.target.value)}
                  style={{
                    marginLeft: "8px",
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
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px 24px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  Original HTML file
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileChange("original")}
                    style={{
                      fontSize: "13px",
                    }}
                  />
                  {fileOriginalName && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Loaded: {fileOriginalName}
                    </span>
                  )}
                </label>

                <label
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  Modified HTML file
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileChange("modified")}
                    style={{
                      fontSize: "13px",
                    }}
                  />
                  {fileModifiedName && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Loaded: {fileModifiedName}
                    </span>
                  )}
                </label>
              </div>
            )}
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
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "4px",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left: which diff view */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

              {/* Right: granularity selector */}
              <label
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                Granularity:
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as DiffMode)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                  }}
                >
                  <option value="chars">Characters</option>
                  <option value="words">Words</option>
                  <option value="lines">Lines</option>
                </select>
              </label>
            </div>
          )}

          {/* REVIEW CODE */}
          {mainView === "review-code" && (
            <section style={cardStyle}>
              <SectionTitle
                title="Review suggestions (raw HTML)"
                icon={<DocumentTextIcon width={20} height={20} />}
              />

              <ReviewableDiff original={originalHtml} modified={modifiedHtml} />
            </section>
          )}

          {/* REVIEW WYSIWYG */}
          {mainView === "review-wysiwyg" && (
            <section style={cardStyle}>
              <SectionTitle
                title="Visual HTML (WYSIWYG)"
                icon={<EyeIcon width={20} height={20} />}
              />

              <WysiwygDiff original={originalHtml} modified={modifiedHtml} />
            </section>
          )}

          {/* UNIFIED TEXT DIFF */}
          {mainView === "diff" && diffView === "unified" && (
            <section style={cardStyle}>
              <SectionTitle
                title="Unified text diff"
                icon={<AdjustmentsHorizontalIcon width={20} height={20} />}
              />

              <TextDiff
                original={originalHtml}
                modified={modifiedHtml}
                mode={mode}
              />
            </section>
          )}

          {/* SIDE-BY-SIDE TEXT DIFF */}
          {mainView === "diff" && diffView === "side-by-side" && (
            <section style={cardStyle}>
              <SectionTitle
                title="Side-by-side text diff"
                icon={<Squares2X2Icon width={20} height={20} />}
              />

              <SideBySideDiff
                original={originalHtml}
                modified={modifiedHtml}
                mode={mode}
              />
            </section>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;