import React, { useState, useEffect } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Problem, Contest } from '../context/GradientContext';
import { CloseIcon } from './Icons';
import { DifficultyBadge } from './StatusBadge';

interface ContestFormProps {
  readonly onClose: () => void;
  readonly problems: readonly Problem[];
  readonly contestToEdit?: Contest;
}

export function ContestForm({ onClose, problems, contestToEdit }: ContestFormProps): JSX.Element {
  const { addContest, updateContest } = useGradient();

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

  // Helper to parse datetime-local string (YYYY-MM-DDTHH:mm) into local Date
  const parseLocalDateTime = (str: string): Date | null => {
    if (!str) return null;
    const [datePart, timePart] = str.split('T');
    if (!datePart || !timePart) return null;
    const [yyyy, MM, dd] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    return new Date(yyyy, MM - 1, dd, hh, mm);
  };

  // Helper to format Date into datetime-local string (YYYY-MM-DDTHH:mm) in local time
  const formatLocalDateTime = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [title, setTitle] = useState(contestToEdit?.title || '');
  const [description, setDescription] = useState(contestToEdit?.description || '');
  const [startTime, setStartTime] = useState(contestToEdit ? formatLocalDateTime(new Date(contestToEdit.startTime)) : '');
  const [endTime, setEndTime] = useState(contestToEdit ? formatLocalDateTime(new Date(contestToEdit.endTime)) : '');
  const [selectedProblems, setSelectedProblems] = useState<string[]>(contestToEdit?.problems ? [...contestToEdit.problems] : []);

  // Initialize with current time rounded to next 5 minutes, and set default end time to +2 hours
  useEffect(() => {
    if (contestToEdit) return;
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    const start = new Date(now.getTime() + (roundedMinutes - minutes) * 60 * 1000);
    start.setSeconds(0, 0);
    
    const end = new Date(start.getTime() + 120 * 60 * 1000); // 2 hours later
    
    setStartTime(formatLocalDateTime(start));
    setEndTime(formatLocalDateTime(end));
  }, [contestToEdit]);

  const handleCreateContest = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime) {
      alert('Please fill in all fields.');
      return;
    }

    const startObj = parseLocalDateTime(startTime);
    const endObj = parseLocalDateTime(endTime);
    if (!startObj || !endObj) {
      alert('Invalid date format.');
      return;
    }

    if (endObj.getTime() <= startObj.getTime()) {
      alert('End time must be after start time.');
      return;
    }

    try {
      if (contestToEdit) {
        await updateContest(contestToEdit.id, {
          title,
          description,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          isPublic: true,
          problems: selectedProblems
        });
      } else {
        await addContest({
          title,
          description,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          isPublic: true,
          problems: selectedProblems
        });
      }

      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setSelectedProblems([]);
      onClose();
    } catch (err) {
      alert('Failed to save contest.');
    }
  };

  const toggleProblemSelection = (probId: string): void => {
    setSelectedProblems(prev =>
      prev.includes(probId) ? prev.filter(id => id !== probId) : [...prev, probId]
    );
  };

  // Compute duration helpers
  const startObj = parseLocalDateTime(startTime);
  const endObj = parseLocalDateTime(endTime);
  const currentDiffMins = (startObj && endObj) ? Math.round((endObj.getTime() - startObj.getTime()) / 60000) : -1;

  const getDurationText = (): { text: string; isError: boolean } => {
    if (!startObj || !endObj) return { text: '', isError: false };
    const diffMs = endObj.getTime() - startObj.getTime();
    if (diffMs < 0) {
      return { text: 'End time must be after start time.', isError: true };
    }
    if (diffMs === 0) {
      return { text: 'Contest duration cannot be zero.', isError: true };
    }
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    let desc = 'Contest will run for ';
    if (hours > 0) {
      desc += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (mins > 0) {
      if (hours > 0) desc += ' ';
      desc += `${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return { text: desc, isError: false };
  };

  const { text: durationText, isError: isDurationError } = getDurationText();

  const durationPresets = [
    { label: '1h', mins: 60 },
    { label: '2h', mins: 120 },
    { label: '3h', mins: 180 },
    { label: '5h', mins: 300 },
    { label: '24h', mins: 1440 }
  ];

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
          <h3>{contestToEdit ? 'Edit Contest' : 'Schedule New Contest'}</h3>
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
              <div className="form-label-row">
                <label htmlFor="contest-start" className="form-label">Start Time <span className="text-danger">*</span></label>
                <button
                  type="button"
                  className="form-label-action-btn"
                  onClick={() => {
                    const now = new Date();
                    now.setSeconds(0, 0);
                    setStartTime(formatLocalDateTime(now));
                  }}
                >
                  Set to Now
                </button>
              </div>
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

          <div className="duration-presets-group">
            <span className="duration-presets-label">Duration Preset:</span>
            <div className="duration-presets">
              {durationPresets.map((preset) => {
                const isActive = currentDiffMins === preset.mins;
                return (
                  <button
                    key={preset.mins}
                    type="button"
                    className={`duration-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      const startVal = parseLocalDateTime(startTime) || new Date();
                      const newEnd = new Date(startVal.getTime() + preset.mins * 60 * 1000);
                      setEndTime(formatLocalDateTime(newEnd));
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {durationText && (
            <div className={`duration-helper-text ${isDurationError ? 'error' : ''}`}>
              {durationText}
            </div>
          )}

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">Select Contest Problems</label>
            <div className="problems-checkbox-list">
              {problems.map((p) => {
                const isSelected = selectedProblems.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`problem-selection-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleProblemSelection(p.id)}
                  >
                    <div className="problem-selection-checkbox">
                      <span className={`checkbox-icon ${isSelected ? 'checked' : ''}`}>
                        {isSelected && '✓'}
                      </span>
                    </div>
                    <span className="problem-selection-title">{p.title}</span>
                    <div className="problem-selection-meta">
                      <DifficultyBadge difficulty={p.difficulty} />
                      {p.score > 0 && <span className="problem-score">{p.score} pts</span>}
                    </div>
                  </div>
                );
              })}
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
              {contestToEdit ? 'Save Changes' : 'Schedule Contest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
