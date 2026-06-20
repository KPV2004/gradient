import React, { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useGradient } from "../context/GradientContext";
import type { Submission } from "../context/GradientContext";

import { StatementPanel } from "./StatementPanel";
import { GraderConsole } from "./GraderConsole";
import { SubmissionsHistory } from "./SubmissionsHistory";
import { PlayIcon, UploadIcon } from "./Icons";

interface ProblemDetailProps {
  readonly problemId: string;
  readonly onBack: () => void;
}

// ─── Language templates ───────────────────────────────────────────────────────
const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `def solve():
    import sys
    data = sys.stdin.read().split()
    if not data:
        return

    # Write your solution here
    print("Hello World")

if __name__ == '__main__':
    solve()`,

  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here
    cout << "Hello World" << "\\n";

    return 0;
}`,

  go: `package main

import (
\t"bufio"
\t"fmt"
\t"os"
)

func main() {
\treader := bufio.NewReader(os.Stdin)
\t_ = reader

\t// Write your solution here
\tfmt.Println("Hello World")
}`,

  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here
        System.out.println("Hello World");
    }
}`,

  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line.trim()));
rl.on('close', () => {
    // Write your solution here
    console.log("Hello World");
});`,

  rust: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    // Write your solution here
    println!("Hello World");
}`,
};

// ─── File extension → language mapping ───────────────────────────────────────
const EXT_TO_LANG: Record<string, string> = {
  py: "python",
  pyw: "python",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  c: "cpp",
  h: "cpp",
  hpp: "cpp",
  go: "go",
  java: "java",
  js: "javascript",
  mjs: "javascript",
  ts: "javascript", // treat TS as JS for now
  rs: "rust",
};

const LANG_LABELS: Record<string, string> = {
  python: "Python 3.12",
  cpp: "C++ 20 (GCC 14)",
  go: "Go 1.22",
  java: "Java 21",
  javascript: "JavaScript (Node 22)",
  rust: "Rust 1.78",
};

function detectLang(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProblemDetail({
  problemId,
  onBack,
}: ProblemDetailProps): JSX.Element {
  const { problems, testcases, submissions, submitCode, role, username, theme } = useGradient();
  const problem = problems.find((p) => p.id === problemId);
  const probTestcases = testcases.filter((t) => t.problemId === problemId);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'submissions'>('description');

  // File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLanguageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] ?? "");
    setUploadedFile(null);
    setUploadError(null);
  };

  // ─── File processing ─────────────────────────────────────────────────────
  const processFile = useCallback((file: File): void => {
    setUploadError(null);

    // Validate size (max 512 KB)
    if (file.size > 512 * 1024) {
      setUploadError(
        `File too large (${(file.size / 1024).toFixed(0)} KB). Max 512 KB.`,
      );
      return;
    }

    // Detect language
    const detectedLang = detectLang(file.name);
    if (!detectedLang) {
      setUploadError(
        `Unknown file type ".${file.name.split(".").pop()}". Supported: .py .cpp .go .java .js .rs`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e): void => {
      const content = e.target?.result as string;
      setCode(content);
      setLanguage(detectedLang);
      setUploadedFile(file.name);
    };
    reader.onerror = (): void => {
      setUploadError("Failed to read file.");
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => setIsDragging(false);

  const clearUpload = (): void => {
    setUploadedFile(null);
    setUploadError(null);
    setCode(LANGUAGE_TEMPLATES[language] ?? "");
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConsole(true);
    try {
      const subId = await submitCode(problemId, language, code);
      setActiveSubId(subId);
    } catch (e) {
      console.error('Submission failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPastSubmission = (sub: Submission): void => {
    setLanguage(sub.language);
    setCode(sub.sourceCode);
    setActiveSubId(sub.id);
    setShowConsole(true);
    setUploadedFile(null);
  };

  if (!problem) {
    return (
      <div className="card text-center p-8">
        <h2 className="text-danger">Problem Not Found</h2>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={onBack}
        >
          Go Back
        </button>
      </div>
    );
  }

  const activeSubmission = submissions.find((s) => s.id === activeSubId);
  const problemSubmissions = submissions.filter((s) => {
    const matches = s.problemId === problemId && s.id !== activeSubId;
    if (!matches) return false;
    if (role === "student" && s.username !== username) return false;
    return true;
  });
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="problem-detail-container">
      <div className="detail-header">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onBack}
        >
          ← Back to Problems
        </button>
        <div className="header-meta">
          <span className="badge badge-diff-detail">{problem.difficulty}</span>
          <span className="meta-item">
            Score: <strong>{problem.score} pts</strong>
          </span>
          <span className="meta-item">
            Time Limit: <strong>{problem.timeoutMs} ms</strong>
          </span>
          <span className="meta-item">
            Memory Limit: <strong>{problem.memoryLimitMb} MB</strong>
          </span>
        </div>
      </div>

      <div className="detail-body-grid">
        {/* Left Panel: Description, Testcases, Submissions Tabs */}
        <div className="workspace-tabs-container">
          <div className="workspace-tabs-header">
            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'testcases' ? 'active' : ''}`}
              onClick={() => setActiveTab('testcases')}
            >
              Sample Cases
            </button>
            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              Submissions ({problemSubmissions.length})
            </button>
          </div>

          <div className="workspace-tabs-content">
            {activeTab === 'description' && (
              <StatementPanel problem={problem} testcases={probTestcases} showOnly="description" />
            )}
            {activeTab === 'testcases' && (
              <StatementPanel problem={problem} testcases={probTestcases} showOnly="testcases" />
            )}
            {activeTab === 'submissions' && (
              <SubmissionsHistory
                submissions={problemSubmissions}
                onLoadSubmission={loadPastSubmission}
              />
            )}
          </div>
        </div>

        {/* Right: IDE */}
        <div className="editor-panel">
          <div className="editor-card card">
            {/* ── Editor header ── */}
            <div className="editor-header">
              <div className="lang-selector-group">
                <label htmlFor="lang-select" className="sr-only">
                  Select Language
                </label>
                <select
                  id="lang-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="form-control select-language"
                >
                  {Object.entries(LANG_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="editor-actions">
                {/* Upload file button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".py,.pyw,.cpp,.cxx,.cc,.c,.h,.hpp,.go,.java,.js,.mjs,.ts,.rs"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                  aria-label="Upload source file"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-icon btn-sm upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload source file (.py .cpp .go .java .js .rs)"
                >
                  <UploadIcon size={14} />
                  Upload File
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-icon btn-run"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner btn-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PlayIcon size={16} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Upload status bar ── */}
            {(uploadedFile || uploadError) && (
              <div
                className={`upload-status-bar ${uploadError ? "upload-error" : "upload-success"}`}
              >
                {uploadedFile && (
                  <>
                    <span className="upload-file-icon">📄</span>
                    <span className="upload-file-name">{uploadedFile}</span>
                    <span className="upload-lang-detected">
                      → Detected: <strong>{LANG_LABELS[language]}</strong>
                    </span>
                    <button
                      type="button"
                      className="upload-clear-btn"
                      onClick={clearUpload}
                      title="Clear uploaded file and restore template"
                    >
                      ✕ Clear
                    </button>
                  </>
                )}
                {uploadError && (
                  <>
                    <span>⚠️ {uploadError}</span>
                    <button
                      type="button"
                      className="upload-clear-btn"
                      onClick={() => setUploadError(null)}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Drop zone overlay + editor ── */}
            <div
              className={`editor-drop-wrapper ${isDragging ? "dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isDragging && (
                <div className="drop-overlay">
                  <div className="drop-overlay-content">
                    <UploadIcon size={36} />
                    <p>Drop your source file here</p>
                    <span>
                      .py &nbsp;·&nbsp; .cpp &nbsp;·&nbsp; .go &nbsp;·&nbsp;
                      .java &nbsp;·&nbsp; .js &nbsp;·&nbsp; .rs
                    </span>
                  </div>
                </div>
              )}

              <div className="editor-textarea-wrapper">
                <Editor
                  height="100%"
                  language={language}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  value={code}
                  onChange={(value) => setCode(value ?? "")}
                  loading={
                    <div className="console-loader" style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="wave-loader">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: isSubmitting,
                    automaticLayout: true,
                    tabSize: 4,
                    padding: { top: 16, bottom: 16 },
                  }}
                />
              </div>
            </div>

            <div className="editor-footer">
              <span>Lines: {lineCount}</span>
              {uploadedFile && (
                <span className="footer-file-tag">📄 {uploadedFile}</span>
              )}
              <span>Encoding: UTF-8</span>
            </div>
          </div>

          <GraderConsole
            activeSubmission={activeSubmission}
            showConsole={showConsole}
            onClose={() => setShowConsole(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
