import React, { useState } from 'react';
import { useGradient } from '../context/GradientContext';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { TableActionButton } from './Table';

interface TestcaseManagerProps {
  readonly problemId: string;
  readonly onBack: () => void;
}

export function TestcaseManager({ problemId, onBack }: TestcaseManagerProps): JSX.Element {
  const { problems, testcases, addTestcase, deleteTestcase } = useGradient();
  const problem = problems.find(p => p.id === problemId);
  const probTestcases = testcases.filter(t => t.problemId === problemId);

  const [input, setInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [score, setScore] = useState(50);
  const [isSample, setIsSample] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!problem) {
    return (
      <div className="card text-center p-8">
        <h2 className="text-danger">Problem Not Found</h2>
        <button type="button" className="btn btn-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!input.trim() || !expectedOutput.trim()) {
      alert('Please fill in both input and expected output fields.');
      return;
    }

    addTestcase(problemId, {
      input,
      expectedOutput,
      score: Number(score),
      isSample
    });

    // Reset Form
    setInput('');
    setExpectedOutput('');
    setScore(50);
    setIsSample(false);
    setShowAddForm(false);
  };

  const handleDelete = (id: string, index: number): void => {
    if (window.confirm(`Are you sure you want to delete Testcase #${index}?`)) {
      deleteTestcase(id);
    }
  };

  return (
    <div className="testcase-manager-wrapper">
      <div className="detail-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back to Problems
        </button>
        <div className="header-title-wrapper">
          <span className="meta-label">Managing Testcases for</span>
          <h2 className="header-problem-title">{problem.title}</h2>
        </div>
      </div>

      <div className="testcase-body-grid">
        {/* Left Side: Testcases List */}
        <div className="testcases-list-panel card">
          <div className="panel-header">
            <h3>Existing Testcases ({probTestcases.length})</h3>
            {!showAddForm && (
              <button
                type="button"
                className="btn btn-primary btn-sm btn-icon"
                onClick={() => setShowAddForm(true)}
              >
                <PlusIcon size={14} />
                Add Testcase
              </button>
            )}
          </div>

          {probTestcases.length === 0 ? (
            <div className="empty-state">
              <p>No testcases defined. The compiler requires at least 1 testcase to grade submissions.</p>
            </div>
          ) : (
            <div className="testcases-scroll-list">
              {probTestcases.map((tc, idx) => (
                <div key={tc.id} className={`testcase-item-card ${tc.isSample ? 'is-sample-tc' : ''}`}>
                  <div className="tc-card-header">
                    <span className="tc-number">Testcase #{idx + 1}</span>
                    <div className="tc-card-badges">
                      <span className="badge font-mono">{tc.score} pts</span>
                      {tc.isSample ? (
                        <span className="badge badge-sample">Sample (Public)</span>
                      ) : (
                        <span className="badge badge-secret">Secret</span>
                      )}
                      <TableActionButton
                        type="delete"
                        onClick={() => handleDelete(tc.id, idx + 1)}
                        title="Delete Testcase"
                      />
                    </div>
                  </div>
                  <div className="tc-io-grids">
                    <div className="tc-io-block">
                      <span className="block-label">Input:</span>
                      <pre className="block-content">{tc.input}</pre>
                    </div>
                    <div className="tc-io-block">
                      <span className="block-label">Expected Output:</span>
                      <pre className="block-content">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side placeholder when form is hidden */}
        {!showAddForm && (
          <div className="add-testcase-panel card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '360px', padding: '40px 24px', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border)' }}>
            <div style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', padding: '16px', borderRadius: '50%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusIcon size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)', margin: '0 0 8px 0' }}>Configure Testcases</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', margin: '0 0 24px 0', maxWidth: '320px', lineHeight: 1.5 }}>
              Add testcases to verify the correctness of user solutions. Each testcase defines input parameters and the expected output results.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add Testcase
            </button>
          </div>
        )}

        {/* Right Side: Add Testcase Form */}
        {showAddForm && (
          <div className="add-testcase-panel card">
            <div className="panel-header">
              <h3>Create New Testcase</h3>
              <button
                type="button"
                className="btn-console-close"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="testcase-add-form">
              <div className="form-group">
                <label htmlFor="tc-input" className="form-label">Input Data <span className="text-danger">*</span></label>
                <textarea
                  id="tc-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. 4 9\n2 7 11 15"
                  className="form-control form-textarea"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tc-output" className="form-label">Expected Output <span className="text-danger">*</span></label>
                <textarea
                  id="tc-output"
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="e.g. 0 1"
                  className="form-control form-textarea"
                  rows={4}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="tc-score" className="form-label">Weight Score (points)</label>
                  <input
                    id="tc-score"
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    min="1"
                    className="form-control"
                  />
                </div>
                <div className="form-checkbox-group-wrapper">
                  <div className="form-checkbox-group">
                    <input
                      id="tc-is-sample"
                      type="checkbox"
                      checked={isSample}
                      onChange={(e) => setIsSample(e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="tc-is-sample" className="form-checkbox-label">
                      Public Sample Case
                    </label>
                  </div>
                  <p className="field-hint">
                    Sample cases are visible to students directly in the description panel.
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Testcase
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
