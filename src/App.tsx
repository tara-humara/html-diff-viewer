// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
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
type InputMode = "example" | "files" | "ai";

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

  // file upload state
  const [fileOriginalName, setFileOriginalName] = useState("");
  const [fileModifiedName, setFileModifiedName] = useState("");
  const [fileOriginalText, setFileOriginalText] = useState("");
  const [fileModifiedText, setFileModifiedText] = useState("");

  // AI draft state
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiInstruction, setAiInstruction] = useState(
    "Describe how the AI should improve the HTML (tone, length, structure, disclaimers, etc.)."
  );
  const [aiDraftText, setAiDraftText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // view state
  const [mainView, setMainView] = useState<MainView>("review-code");
  const [diffView, setDiffView] = useState<DiffView>("unified");

  const selectedExample =
    examples.find((ex) => ex.id === selectedExampleId) ?? examples[0];

  useEffect(() => window.scrollTo(0, 0), []);

  // effective HTML that flows into all tools
  const originalHtml =
    inputMode === "example"
      ? selectedExample.original
      : inputMode === "files"
        ? fileOriginalText
        : aiSourceText;

  const modifiedHtml =
    inputMode === "example"
      ? selectedExample.modified
      : inputMode === "files"
        ? fileModifiedText
        : aiDraftText || aiSourceText;

  // Shared card style (we'll refactor this later)
  const cardStyle: React.CSSProperties = {
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "16px",
    boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
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

  // --- AI source upload (single file) ---
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAiSourceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    file
      .text()
      .then((text) => {
        setAiSourceText(text);
      })
      .catch((err) => {
        console.error("Failed to read AI source file:", err);
      })
      .finally(() => {
        e.target.value = "";
      });
  };

  // call backend OpenAI route
  const handleGenerateAiDraft = async () => {
    if (!aiSourceText.trim()) {
      alert("Please paste or upload some HTML for the AI to modify.");
      return;
    }

    setAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch("/api/rewrite-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: aiSourceText,
          instruction: aiInstruction,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data: { modifiedHtml: string } = await res.json();
      setAiDraftText(data.modifiedHtml);
    } catch (err: any) {
      console.error("AI rewrite error:", err);
      setAiError(err?.message ?? "Unknown error while calling AI");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <main className="app-shell">
      <div style={{ width: "100%" }}>
        {/* HEADER */}
        <header className="app-header">
          <h1 className="app-header-title">Smart HTML Review Workspace</h1>

          <p className="app-header-subtitle">
            Review AI-generated edits, compare versions, and produce final
            validated HTML.
          </p>

          <section className="input-section">
            {/* Input source toggle */}
            <div className="input-row">
              <span className="input-label-title">Input source:</span>

              <label className="radio-label">
                <input
                  type="radio"
                  name="input-mode"
                  value="example"
                  checked={inputMode === "example"}
                  onChange={() => setInputMode("example")}
                />
                Examples
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="input-mode"
                  value="files"
                  checked={inputMode === "files"}
                  onChange={() => setInputMode("files")}
                />
                Upload files
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="input-mode"
                  value="ai"
                  checked={inputMode === "ai"}
                  onChange={() => setInputMode("ai")}
                />
                AI draft
              </label>
            </div>

            {/* Example mode */}
            {inputMode === "example" && (
              <div className="example-select-row">
                Input text:
                <select
                  value={selectedExample.id}
                  onChange={(e) => setSelectedExampleId(e.target.value)}
                  className="dropdown"
                >
                  {examples.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Upload files mode */}
            {inputMode === "files" && (
              <div className="upload-grid">
                <div className="upload-col">
                  Original HTML file
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileChange("original")}
                  />
                  {fileOriginalName && (
                    <span className="upload-note">
                      Loaded: {fileOriginalName}
                    </span>
                  )}
                </div>

                <div className="upload-col">
                  Modified HTML file
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileChange("modified")}
                  />
                  {fileModifiedName && (
                    <span className="upload-note">
                      Loaded: {fileModifiedName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* AI draft mode */}
            {inputMode === "ai" && (
              <div className="ai-grid">
                {/* Left: source HTML */}
                <div className="ai-col">
                  <span className="ai-label">Original HTML</span>

                  <button
                    type="button"
                    className="ai-upload-btn"
                    onClick={() => aiFileInputRef.current?.click()}
                  >
                    Upload HTML file…
                  </button>

                  <input
                    ref={aiFileInputRef}
                    type="file"
                    accept=".html,.htm,.txt"
                    style={{ display: "none" }}
                    onChange={handleAiSourceFileUpload}
                  />

                  <textarea
                    value={aiSourceText}
                    onChange={(e) => setAiSourceText(e.target.value)}
                    className="textarea"
                    placeholder="Paste the HTML here or upload an HTML file."
                  />
                </div>

                {/* Right: instruction + generate button */}
                <div className="ai-col">
                  <span className="ai-label">Instruction for AI</span>

                  <textarea
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    className="textarea"
                    placeholder="Describe how the AI should improve the HTML."
                    style={{ minHeight: "80px" }}
                  />

                  <button
                    type="button"
                    disabled={aiGenerating || !aiSourceText.trim()}
                    className="ai-generate-btn"
                    onClick={handleGenerateAiDraft}
                  >
                    {aiGenerating ? "Generating…" : "Generate AI draft"}
                  </button>

                  {aiDraftText && (
                    <span className="ai-status ai-status-success">
                      Draft generated. Review it below.
                    </span>
                  )}

                  {aiError && (
                    <span className="ai-status ai-status-error">
                      {aiError}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        </header>

        {/* WORKSPACE SECTIONS */}
        <section className="workspace">
          {/* MAIN MENU TABS */}
          <div className="main-tabs">
            <button
              type="button"
              className={`tab ${mainView === "diff" ? "tab--active" : ""}`}
              onClick={() => setMainView("diff")}
            >
              <AdjustmentsHorizontalIcon width={18} height={18} />
              View diff
            </button>

            <button
              type="button"
              className={`tab ${mainView === "review-code" ? "tab--active" : ""
                }`}
              onClick={() => setMainView("review-code")}
            >
              <DocumentTextIcon width={18} height={18} />
              Review code
            </button>

            <button
              type="button"
              className={`tab ${mainView === "review-wysiwyg" ? "tab--active" : ""
                }`}
              onClick={() => setMainView("review-wysiwyg")}
            >
              <EyeIcon width={18} height={18} />
              Review WYSIWYG
            </button>
          </div>

          {/* SUB-MENU: only for "View diff" */}
          {mainView === "diff" && (
            <div className="diff-toolbar">
              {/* Left: which diff view */}
              <div className="diff-view-tabs">
                <button
                  type="button"
                  className={`diff-view-tab ${diffView === "unified" ? "diff-view-tab--active" : ""
                    }`}
                  onClick={() => setDiffView("unified")}
                >
                  Unified text diff
                </button>

                <button
                  type="button"
                  className={`diff-view-tab ${diffView === "side-by-side" ? "diff-view-tab--active" : ""
                    }`}
                  onClick={() => setDiffView("side-by-side")}
                >
                  Side-by-side text diff
                </button>
              </div>

              {/* Right: granularity selector */}
              <label className="granularity-label">
                Granularity:
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as DiffMode)}
                  className="granularity-select"
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