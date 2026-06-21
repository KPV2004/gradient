import React, { useState } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Problem } from '../context/GradientContext';
import { Modal } from './Modal';
import { Table, TableActionButton } from './Table';
import { DifficultyBadge, ProblemStatusIcon } from './StatusBadge';

import { 
  PlusIcon, 
  BookOpenIcon, 
  TagIcon 
} from './Icons';

interface ProblemListProps {
  readonly onSelectProblem: (id: string) => void;
  readonly onCreateProblem: () => void;
  readonly onEditProblem: (id: string) => void;
  readonly onManageTestcases: (id: string) => void;
}

export function ProblemList({
  onSelectProblem,
  onCreateProblem,
  onEditProblem,
  onManageTestcases,
}: ProblemListProps): JSX.Element {
  const { role, problems, submissions, deleteProblem, publishProblem, username } = useGradient();
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [deleteModalConfig, setDeleteModalConfig] = useState<{ isOpen: boolean; problemId: string; problemTitle: string }>({
    isOpen: false,
    problemId: '',
    problemTitle: '',
  });

  // Determine user's status for each problem
  const getProblemStatus = (problemId: string): 'solved' | 'failed' | 'unattempted' => {
    const probSubmissions = submissions.filter(s => s.problemId === problemId);
    if (probSubmissions.length === 0) return 'unattempted';
    const isSolved = probSubmissions.some(s => s.status === 'Accepted');
    return isSolved ? 'solved' : 'failed';
  };

  // Solved stats
  const publishedProblems = problems.filter(p => (role === 'admin' || role === 'teacher') ? true : p.isPublished);
  const easyProbs = publishedProblems.filter(p => p.difficulty === 'Easy');
  const mediumProbs = publishedProblems.filter(p => p.difficulty === 'Medium');
  const hardProbs = publishedProblems.filter(p => p.difficulty === 'Hard');

  const solvedEasy = easyProbs.filter(p => getProblemStatus(p.id) === 'solved').length;
  const solvedMedium = mediumProbs.filter(p => getProblemStatus(p.id) === 'solved').length;
  const solvedHard = hardProbs.filter(p => getProblemStatus(p.id) === 'solved').length;

  const totalSolved = solvedEasy + solvedMedium + solvedHard;
  const totalScore = publishedProblems
    .filter(p => getProblemStatus(p.id) === 'solved')
    .reduce((acc, curr) => acc + curr.score, 0);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(publishedProblems.flatMap(p => p.tags || []))
  );

  // Filter problems based on search, difficulty, tag, and role visibility
  const filteredProblems = problems.filter((prob) => {
    // General users only see published problems
    if (role === 'student' && !prob.isPublished) return false;

    const matchesSearch =
      prob.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prob.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === 'All' || prob.difficulty === difficultyFilter;

    const matchesTag =
      selectedTag === 'All' || (prob.tags && prob.tags.includes(selectedTag));

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  const handleDelete = (id: string, title: string): void => {
    setDeleteModalConfig({
      isOpen: true,
      problemId: id,
      problemTitle: title,
    });
  };

  const handleConfirmDelete = (): void => {
    deleteProblem(deleteModalConfig.problemId);
  };



  // Table configurations
  const headers = [
    ...(role === 'student' ? ["Status"] : []),
    "Title",
    "Difficulty",
    "Score",
    ...((role === 'admin' || role === 'teacher') ? ["Published"] : []),
    "Actions"
  ];

  const columnClasses = [
    ...(role === 'student' ? ["col-status"] : []),
    "col-title",
    "col-difficulty",
    "col-score",
    ...((role === 'admin' || role === 'teacher') ? ["col-published"] : []),
    "col-actions"
  ];

  const columnAlignments: ('left' | 'center' | 'right')[] = [
    ...(role === 'student' ? ["left" as const] : []),
    "left",
    "left",
    "center",
    ...((role === 'admin' || role === 'teacher') ? ["center" as const] : []),
    "right"
  ];

  const rows = filteredProblems.map((prob) => {
    const status = getProblemStatus(prob.id);
    return [
      ...(role === 'student' ? [
        <ProblemStatusIcon key={`status-${prob.id}`} status={status} />
      ] : []),
      <div key={`title-${prob.id}`}>
        <div className="problem-title-cell" onClick={() => onSelectProblem(prob.id)}>
          <span className="prob-title-text">{prob.title}</span>
          {!prob.isPublished && (
            <span className="badge badge-draft" title="Draft">Draft</span>
          )}
        </div>
        {prob.tags && prob.tags.length > 0 && (
          <div className="problem-card-tags">
            {prob.tags.map(t => (
              <span key={t} className="prob-tag-chip">{t}</span>
            ))}
          </div>
        )}
      </div>,
      <DifficultyBadge key={`diff-${prob.id}`} difficulty={prob.difficulty} />,
      <span key={`score-${prob.id}`} className="font-mono">
        {prob.score}
      </span>,
      ...((role === 'admin' || role === 'teacher') ? [
        <div key={`pub-${prob.id}`} className="text-center">
          <TableActionButton
            type={prob.isPublished ? 'unpublish' : 'publish'}
            onClick={() => publishProblem(prob.id, !prob.isPublished)}
            title={prob.isPublished ? 'Unpublish' : 'Publish'}
          />
        </div>
      ] : []),
      <div key={`actions-${prob.id}`}>
        {(role === 'admin' || role === 'teacher') ? (
          <div className="admin-actions-group">
            <TableActionButton
              type="database"
              onClick={() => onManageTestcases(prob.id)}
              title="Manage Testcases"
            />
            <TableActionButton
              type="edit"
              onClick={() => onEditProblem(prob.id)}
              title="Edit Problem"
            />
            <TableActionButton
              type="delete"
              onClick={() => handleDelete(prob.id, prob.title)}
              title="Delete"
            />
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onSelectProblem(prob.id)}
          >
            Solve
          </button>
        )}
      </div>
    ];
  });

  const rowKeys = filteredProblems.map(prob => prob.id);
  const rowClasses = filteredProblems.map(prob => !prob.isPublished ? 'row-unpublished' : '');

  return (
    <div className="problem-list-wrapper">
      {/* Classroom Dashboard Summary - Student only */}
      {role === 'student' && (
        <div className="classroom-hub-container">
          <div className="classroom-banner">
            <div className="banner-icon-bg">
              <BookOpenIcon size={28} className="banner-icon" />
            </div>
            <div className="banner-text-wrapper">
              <span className="banner-tag">CLASSROOM WORKSPACE</span>
              <h2 className="banner-title">Computer Science 101: Data Structures</h2>
              <p className="banner-desc">
                Welcome back, <strong>{username}</strong>! Solve challenges to level up your algorithms skills and prepare for active contests.
              </p>
            </div>
          </div>

          <div className="classroom-stats-row">
            {/* Gamified stats progress */}
            <div className="card stat-card">
              <span className="stat-label">Learning Progress</span>
              <div className="stat-value font-mono">
                {totalSolved} <span className="stat-value-slash">/ {publishedProblems.length}</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${publishedProblems.length ? (totalSolved / publishedProblems.length) * 100 : 0}%` }} 
                />
              </div>
              <span className="stat-subtext">Problems solved successfully</span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Difficulty Breakdown</span>
              <div className="difficulty-breakdown-badges">
                <div className="diff-breakdown-item">
                  <span className="badge diff-easy">Easy</span>
                  <span className="breakdown-val font-mono">{solvedEasy}/{easyProbs.length}</span>
                </div>
                <div className="diff-breakdown-item">
                  <span className="badge diff-medium">Medium</span>
                  <span className="breakdown-val font-mono">{solvedMedium}/{mediumProbs.length}</span>
                </div>
                <div className="diff-breakdown-item">
                  <span className="badge diff-hard">Hard</span>
                  <span className="breakdown-val font-mono">{solvedHard}/{hardProbs.length}</span>
                </div>
              </div>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Points & Standing</span>
              <div className="stat-value text-green font-mono">
                {totalScore} <span className="stat-value-slash">XP</span>
              </div>
              <span className="stat-subtext">Class Ranking: <strong>#4 of 32</strong></span>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="classroom-announcement-card card border-active">
            <div className="announcement-badge">ANNOUNCEMENT</div>
            <div className="announcement-content">
              <strong>Instructor Joy:</strong> "Classroom Assignment 2 has been updated. Please ensure you try <code>Valid Parentheses</code> using the <strong>Stack</strong> data structure pattern before next Tuesday's lecture."
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <div>
          <h1 className="section-title">Coding Challenges</h1>
          <p className="section-subtitle">
            {(role === 'admin' || role === 'teacher') 
              ? 'Manage public and private problem definitions and testcases.' 
              : 'Choose a problem, write code, and submit it for real-time sandbox verification.'}
          </p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <button
            type="button"
            className="btn btn-primary btn-icon"
            onClick={onCreateProblem}
          >
            <PlusIcon size={16} />
            Create Problem
          </button>
        )}
      </div>

      <div className="filters-container">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search problems by name or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control search-input"
          />
        </div>
        <div className="difficulty-tabs">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              type="button"
              className={`tab-btn ${difficultyFilter === diff ? 'active' : ''}`}
              onClick={() => setDifficultyFilter(diff)}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Topic Tags Bar */}
      {allTags.length > 0 && (
        <div className="tags-filter-bar">
          <span className="tags-label"><TagIcon size={14} className="mr-1" /> Topic:</span>
          <div className="tags-scroll-container">
            <button 
              type="button" 
              className={`tag-filter-chip ${selectedTag === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedTag('All')}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-filter-chip ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card list-card">
        <Table
          headers={headers}
          rows={rows}
          rowKeys={rowKeys}
          rowClasses={rowClasses}
          columnAlignments={columnAlignments}
          columnClasses={columnClasses}
        />
      </div>

      <Modal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title="Delete Problem"
        message={`Are you sure you want to delete the problem "${deleteModalConfig.problemTitle}"? This action is permanent and cannot be undone.`}
        type="cancel"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
