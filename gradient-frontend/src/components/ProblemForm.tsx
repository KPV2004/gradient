import React, { useState, useEffect } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Problem } from '../context/GradientContext';
import { Modal } from './Modal';


interface ProblemFormProps {
  readonly problemId?: string;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export function ProblemForm({ problemId, onSave, onCancel }: ProblemFormProps): JSX.Element {
  const { problems, addProblem, updateProblem } = useGradient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [score, setScore] = useState(100);
  const [timeoutMs, setTimeoutMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [tagsString, setTagsString] = useState('');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'accept' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'accept',
    onConfirm: () => {},
  });

  // Load existing problem details if editing
  useEffect(() => {
    if (problemId) {
      const prob = problems.find(p => p.id === problemId);
      if (prob) {
        setTitle(prob.title);
        setSlug(prob.slug);
        setDifficulty(prob.difficulty);
        setScore(prob.score);
        setTimeoutMs(prob.timeoutMs);
        setMemoryLimitMb(prob.memoryLimitMb);
        setDescription(prob.description);
        setInputFormat(prob.inputFormat);
        setOutputFormat(prob.outputFormat);
        setConstraints(prob.constraints);
        setIsPublished(prob.isPublished);
        setTagsString(prob.tags ? prob.tags.join(', ') : '');
      }
    }
  }, [problemId, problems]);

  // Auto generate slug from title when creating
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setTitle(val);
    if (!problemId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!title || !slug || !description) {
      alert('Please fill in Title, Slug, and Description fields.');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: problemId ? 'Save Changes' : 'Create Challenge',
      message: problemId 
        ? 'Are you sure you want to save all changes to this challenge? This will update the definition for all users.'
        : 'Are you sure you want to create this new challenge?',
      type: 'accept',
      onConfirm: executeSave,
    });
  };

  const executeSave = (): void => {
    const payload = {
      title,
      slug,
      difficulty,
      score: Number(score),
      timeoutMs: Number(timeoutMs),
      memoryLimitMb: Number(memoryLimitMb),
      description,
      inputFormat,
      outputFormat,
      constraints,
      isPublished,
      tags: tagsString.split(',').map(t => t.trim()).filter(Boolean)
    };

    if (problemId) {
      updateProblem(problemId, payload);
    } else {
      addProblem(payload);
    }

    onSave();
  };

  const handleCancelClick = (): void => {
    setModalConfig({
      isOpen: true,
      title: 'Discard Changes',
      message: 'Are you sure you want to discard your changes? All unsaved work will be lost.',
      type: 'warning',
      onConfirm: onCancel,
    });
  };

  return (
    <div className="form-page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {problemId ? 'Edit Challenge Definition' : 'Create New Challenge'}
          </h1>
          <p className="section-subtitle">
            Configure challenge details, resource boundaries, and publish status.
          </p>
        </div>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit} className="problem-editor-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="problem-title" className="form-label">Title <span className="text-danger">*</span></label>
              <input
                id="problem-title"
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Binary Search"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="problem-slug" className="form-label">URL Slug <span className="text-danger">*</span></label>
              <input
                id="problem-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. binary-search"
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '8px', marginBottom: '16px' }}>
            <label htmlFor="problem-tags" className="form-label">Tags (comma-separated)</label>
            <input
              id="problem-tags"
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="e.g. Array, Hash Table, Dynamic Programming, Greedy"
              className="form-control"
            />
            <p className="form-helper-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: '0' }}>
              Separate tags with commas. E.g. String, Stack, Tree
            </p>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label htmlFor="problem-difficulty" className="form-label">Difficulty</label>
              <select
                id="problem-difficulty"
                value={difficulty}

                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Easy' || val === 'Medium' || val === 'Hard') {
                    setDifficulty(val);
                  }
                }}
                className="form-control"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="problem-score" className="form-label">Total Score</label>
              <input
                id="problem-score"
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min="0"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="problem-timeout" className="form-label">Timeout Limit (ms)</label>
              <input
                id="problem-timeout"
                type="number"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                min="100"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="problem-memory" className="form-label">Memory Limit (MB)</label>
              <input
                id="problem-memory"
                type="number"
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                min="4"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="problem-description" className="form-label">Description (Markdown Supported) <span className="text-danger">*</span></label>
            <textarea
              id="problem-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem statement clearly. Use ticks \`\` for code snippets."
              className="form-control form-textarea"
              rows={6}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="problem-input-format" className="form-label">Input Format</label>
              <textarea
                id="problem-input-format"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. First line contains N. Next line contains N items..."
                className="form-control form-textarea"
                rows={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="problem-output-format" className="form-label">Output Format</label>
              <textarea
                id="problem-output-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. Output the smallest index containing the value..."
                className="form-control form-textarea"
                rows={4}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="problem-constraints" className="form-label">Constraints</label>
            <textarea
              id="problem-constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 1 <= N <= 10^5"
              className="form-control form-textarea"
              rows={3}
            />
          </div>

          <div className="form-checkbox-group">
            <input
              id="problem-publish"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor="problem-publish" className="form-checkbox-label">
              Publish challenge immediately (make visible to general users/students)
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelClick}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {problemId ? 'Save Changes' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}
