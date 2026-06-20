import React, { useState } from 'react';
import type { Problem, Testcase } from '../context/GradientContext';

interface StatementPanelProps {
  readonly problem: Problem;
  readonly testcases: readonly Testcase[];
  readonly showOnly?: 'description' | 'testcases' | 'all';
}

export function StatementPanel({ problem, testcases, showOnly = 'all' }: StatementPanelProps): JSX.Element {
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>({});

  const handleCopy = (text: string, id: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [id]: 'Copied!' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [id]: '' }));
      }, 2000);
    });
  };

  // Safe markdown text parser rendering ticks as code elements
  const renderText = (txt: string): JSX.Element[] => {
    return txt.split('\n').map((line, idx) => {
      const parts = line.split(/(`[^`]+`)/g);
      const lineKey = `line-${line.substring(0, 10)}-${idx}`;
      return (
        <p key={lineKey} className="statement-paragraph">
          {parts.map((part, pIdx) => {
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={`code-${part}-${pIdx}`}>{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const showAll = showOnly === 'all';
  const showDescription = showAll || showOnly === 'description';
  const showTestcases = showAll || showOnly === 'testcases';

  return (
    <div className="statement-panel card">
      {showDescription && (
        <>
          <h1 className="problem-detail-title">{problem.title}</h1>

          <div className="statement-section">
            <h3 className="section-subheading">Description</h3>
            <div className="statement-content">{renderText(problem.description)}</div>
          </div>

          <div className="statement-section">
            <h3 className="section-subheading">Input Format</h3>
            <div className="statement-content">{renderText(problem.inputFormat)}</div>
          </div>

          <div className="statement-section">
            <h3 className="section-subheading">Output Format</h3>
            <div className="statement-content">{renderText(problem.outputFormat)}</div>
          </div>

          {problem.constraints && (
            <div className="statement-section">
              <h3 className="section-subheading">Constraints</h3>
              <pre className="code-block constraints-block">{problem.constraints}</pre>
            </div>
          )}
        </>
      )}

      {showTestcases && (
        /* Copyable public testcases */
        <div className="statement-section">
          <h3 className="section-subheading">Sample Cases</h3>
          <div className="sample-cases-list">
            {testcases.filter(t => t.isSample).map((tc, index) => (
              <div key={tc.id} className="sample-case-card">
                <div className="sample-case-header">
                  <span>Sample Case #{index + 1}</span>
                </div>
                <div className="sample-case-row">
                  <div className="sample-case-column">
                    <div className="box-title">
                      <span>Input</span>
                      <button
                        type="button"
                        className="btn-copy-small"
                        onClick={() => handleCopy(tc.input, `${tc.id}_in`)}
                      >
                        {copyStatus[`${tc.id}_in`] || 'Copy'}
                      </button>
                    </div>
                    <pre className="case-io-box">{tc.input}</pre>
                  </div>
                  <div className="sample-case-column">
                    <div className="box-title">
                      <span>Expected Output</span>
                      <button
                        type="button"
                        className="btn-copy-small"
                        onClick={() => handleCopy(tc.expectedOutput, `${tc.id}_out`)}
                      >
                        {copyStatus[`${tc.id}_out`] || 'Copy'}
                      </button>
                    </div>
                    <pre className="case-io-box">{tc.expectedOutput}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
