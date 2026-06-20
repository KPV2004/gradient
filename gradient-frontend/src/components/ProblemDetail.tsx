import React, { useState, useRef } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Submission } from '../context/GradientContext';

import { StatementPanel } from './StatementPanel';
import { GraderConsole } from './GraderConsole';
import { SubmissionsHistory } from './SubmissionsHistory';
import { PlayIcon } from './Icons';

interface ProblemDetailProps {
  readonly problemId: string;
  readonly onBack: () => void;
}

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `def solve():\n    # Read input from standard input\n    import sys\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    \n    # Write your logic here\n    # N = int(input_data[0])\n    \n    # Print output\n    print("Hello World")\n\nif __name__ == '__main__':\n    solve()`,
  cpp: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    // Optimize standard I/O operations\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write your logic here\n    cout << "Hello World" << "\\n";\n    \n    return 0;\n}`,
  go: `package main\n\nimport (\n\t"fmt"\n\t"os"\n\t"bufio"\n)\n\nfunc main() {\n\t// Write your logic here\n\tfmt.Println("Hello World")\n}`
};

export function ProblemDetail({ problemId, onBack }: ProblemDetailProps): JSX.Element {
  const { problems, testcases, submissions, submitCode } = useGradient();
  const problem = problems.find(p => p.id === problemId);
  const probTestcases = testcases.filter(t => t.problemId === problemId);

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineCounterRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll offsets of the editor textarea with line numbers column
  const handleScroll = (): void => {
    if (editorRef.current && lineCounterRef.current) {
      lineCounterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] || '');
  };

  if (!problem) {
    return (
      <div className="card text-center p-8">
        <h2 className="text-danger">Problem Not Found</h2>
        <button type="button" className="btn btn-secondary mt-4" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const activeSubmission = submissions.find(s => s.id === activeSubId);
  const problemSubmissions = submissions.filter(s => s.problemId === problemId && s.id !== activeSubId);

  const handleSubmit = async (): Promise<void> => {
    setShowConsole(true);
    const subId = await submitCode(problemId, language, code);
    setActiveSubId(subId);
  };

  const loadPastSubmission = (sub: Submission): void => {
    setLanguage(sub.language);
    setCode(sub.sourceCode);
    setActiveSubId(sub.id);
    setShowConsole(true);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="problem-detail-container">
      <div className="detail-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back to Problems
        </button>
        <div className="header-meta">
          <span className="badge badge-diff-detail">{problem.difficulty}</span>
          <span className="meta-item">Score: <strong>{problem.score} pts</strong></span>
          <span className="meta-item">Time Limit: <strong>{problem.timeoutMs} ms</strong></span>
          <span className="meta-item">Memory Limit: <strong>{problem.memoryLimitMb} MB</strong></span>
        </div>
      </div>

      <div className="detail-body-grid">
        {/* Left Side: Statement information */}
        <StatementPanel problem={problem} testcases={probTestcases} />

        {/* Right Side: IDE Editor and compiler terminal */}
        <div className="editor-panel">
          <div className="editor-card card">
            <div className="editor-header">
              <div className="lang-selector-group">
                <label htmlFor="lang-select" className="sr-only">Select Language</label>
                <select
                  id="lang-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="form-control select-language"
                >
                  <option value="python">Python 3.12</option>
                  <option value="cpp">C++ 20 (GCC 14)</option>
                  <option value="go">Go 1.26</option>
                </select>
              </div>
              <div className="editor-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-icon btn-run"
                  onClick={handleSubmit}
                >
                  <PlayIcon size={16} />
                  Submit Code
                </button>
              </div>
            </div>

            <div className="editor-textarea-wrapper">
              <div ref={lineCounterRef} className="editor-line-numbers">
                {lineNumbers.map(n => (
                  <div key={n} className="line-num">{n}</div>
                ))}
              </div>
              <textarea
                ref={editorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                className="editor-textarea"
                spellCheck="false"
              />
            </div>
            <div className="editor-footer">
              <span>Lines: {lineCount}</span>
              <span>Encoding: UTF-8</span>
            </div>
          </div>

          <GraderConsole
            activeSubmission={activeSubmission}
            showConsole={showConsole}
            onClose={() => setShowConsole(false)}
          />

          <SubmissionsHistory
            submissions={problemSubmissions}
            onLoadSubmission={loadPastSubmission}
          />
        </div>
      </div>
    </div>
  );
}
