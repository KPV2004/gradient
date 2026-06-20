import React, { useState, useEffect } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Problem } from '../context/GradientContext';
import { CloseIcon } from './Icons';


interface ContestFormProps {
  readonly onClose: () => void;
  readonly problems: readonly Problem[];
}

export function ContestForm({ onClose, problems }: ContestFormProps): JSX.Element {
  const { addContest } = useGradient();

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  const handleCreateContest = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime) {
      alert('Please fill in all fields.');
      return;
    }

    addContest({
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isPublic: true,
      problems: selectedProblems
    });

    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setSelectedProblems([]);
    onClose();
  };

  const toggleProblemSelection = (probId: string): void => {
    setSelectedProblems(prev =>
      prev.includes(probId) ? prev.filter(id => id !== probId) : [...prev, probId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window add-contest-modal-window" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <CloseIcon size={18} />
        </button>
        <div className="panel-header">
          <h3>Schedule New Contest</h3>
        </div>

      <form onSubmit={handleCreateContest} className="contest-add-form">
        <div className="form-group">
          <label htmlFor="contest-title" className="form-label">Contest Title <span className="text-danger">*</span></label>
          <input
            id="contest-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Code Battle #14"
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contest-desc" className="form-label">Description <span className="text-danger">*</span></label>
          <textarea
            id="contest-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Welcome notes and rules of the contest..."
            className="form-control form-textarea"
            rows={3}
            required
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="contest-start" className="form-label">Start Time <span className="text-danger">*</span></label>
            <input
              id="contest-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contest-end" className="form-label">End Time <span className="text-danger">*</span></label>
            <input
              id="contest-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-control"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Select Contest Problems</label>
          <div className="problems-checkbox-list">
            {problems.map((p) => (
              <div key={p.id} className="problem-checkbox-item">
                <input
                  id={`c-prob-${p.id}`}
                  type="checkbox"
                  checked={selectedProblems.includes(p.id)}
                  onChange={() => toggleProblemSelection(p.id)}
                  className="form-checkbox"
                />
                <label htmlFor={`c-prob-${p.id}`} className="checkbox-label-text">
                  {p.title} <span className={`difficulty-indicator diff-${p.difficulty.toLowerCase()}`}>({p.difficulty})</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Schedule Contest
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
