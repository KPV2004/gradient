import React, { useState, useEffect } from "react";
import { useGradient } from "../context/GradientContext";
import type { Contest, Submission } from "../context/GradientContext";

import { ContestForm } from "./ContestForm";
import { Table } from "./Table";
import { ClockIcon, TrophyIcon, UsersIcon } from "./Icons";

interface ContestDetailProps {
  readonly contestId: string;
  readonly onBack: () => void;
  readonly onSelectProblem: (problemId: string) => void;
}

// Live ticking contest countdown timer component
function ContestTimer({ contest }: { readonly contest: Contest }): JSX.Element {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();

      if (now < start) {
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Starts in: ${hours}h ${mins}m ${secs}s`);
      } else if (now > end) {
        setTimeLeft("Contest Finished");
      } else {
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Ends in: ${hours}h ${mins}m ${secs}s`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  return <span className="timer-countdown font-mono">{timeLeft}</span>;
}

export function ContestDetail({
  contestId,
  onBack,
  onSelectProblem,
}: ContestDetailProps): JSX.Element {
  const { role, contests, problems, username, submissions, updateContest, deleteContest } = useGradient();
  const [contestToEdit, setContestToEdit] = useState<Contest | undefined>(undefined);
  const [activeTab, setActiveTabState] = useState<"challenges" | "leaderboard">("challenges");

  const contest = contests.find((c) => c.id === contestId);

  if (!contest) {
    return (
      <div className="contest-page-wrapper">
        <button type="button" className="btn btn-secondary mb-4" onClick={onBack}>
          ← Back to Contests
        </button>
        <div className="card">Contest not found.</div>
      </div>
    );
  }

  const getContestStatus = (c: Contest): "ongoing" | "upcoming" | "ended" => {
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);

    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "ongoing";
  };

  const status = getContestStatus(contest);
  const displayTab = (status === "ended" && role === "student") ? "leaderboard" : activeTab;

  // Helper to calculate contest leaderboard
  const getLeaderboard = (c: Contest) => {
    const contestStart = new Date(c.startTime).getTime();
    const contestEnd = new Date(c.endTime).getTime();

    const competitors = Array.from(
      new Set([
        ...c.participants,
        ...submissions
          .filter((s) => {
            const subTime = new Date(s.createdAt).getTime();
            return (
              c.problems.includes(s.problemId) &&
              subTime >= contestStart &&
              subTime <= contestEnd
            );
          })
          .map((s) => s.username),
      ]),
    );

    const standings = competitors.map((user) => {
      let totalPoints = 0;
      let totalPenalty = 0;
      const problemStats: Record<
        string,
        { solved: boolean; score: number; attempts: number; timeTaken: number }
      > = {};

      c.problems.forEach((pId) => {
        const probSubmissions = submissions
          .filter((s) => s.problemId === pId && s.username === user)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

        const contestSubs = probSubmissions.filter((s) => {
          const subTime = new Date(s.createdAt).getTime();
          return subTime >= contestStart && subTime <= contestEnd;
        });

        const bestSub = contestSubs.reduce<Submission | { score: number }>(
          (best, curr) => (curr.score > best.score ? curr : best),
          { score: 0 },
        );
        const solvedIndex = contestSubs.findIndex(
          (s) => s.status === "Accepted",
        );

        let attempts = 0;
        let timeTaken = 0;

        if (solvedIndex !== -1) {
          attempts = solvedIndex + 1;
          const solvedTime = new Date(
            contestSubs[solvedIndex].createdAt,
          ).getTime();
          timeTaken = Math.max(
            1,
            Math.floor((solvedTime - contestStart) / 60000),
          );
        } else {
          attempts = contestSubs.length;
        }

        problemStats[pId] = {
          solved: solvedIndex !== -1,
          score: bestSub.score,
          attempts,
          timeTaken,
        };

        totalPoints += bestSub.score;
        if (solvedIndex !== -1) {
          totalPenalty += timeTaken + (attempts - 1) * 20;
        }
      });

      return {
        username: user,
        totalPoints,
        totalPenalty,
        problemStats,
      };
    });

    return standings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.totalPenalty - b.totalPenalty;
    });
  };

  const leaderboard = getLeaderboard(contest);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to cancel and delete this contest? This cannot be undone.")) {
      await deleteContest(contest.id);
      onBack();
    }
  };

  const handleEndNow = async () => {
    if (window.confirm("Are you sure you want to end this contest now? It will close immediately.")) {
      await updateContest(contest.id, {
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: new Date().toISOString(),
        isPublic: contest.isPublic,
        problems: contest.problems
      });
    }
  };

  return (
    <div className="contest-page-wrapper">
      <div style={{ marginBottom: "20px" }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back to Contests
        </button>
      </div>

      <div className="card contest-item-card status-ongoing" style={{ maxWidth: "100%", padding: "32px" }}>
        {/* Contest Header Details */}
        <div className="contest-card-top" style={{ marginBottom: "16px" }}>
          <span className={`badge badge-status-${status}`}>
            {status.toUpperCase()}
          </span>
          <div className="contest-timer-badge">
            <ClockIcon size={14} className="mr-1" />
            <ContestTimer contest={contest} />
          </div>
          <span className="creator-text">
            Host: <strong>{contest.createdBy}</strong>
          </span>
        </div>

        <h1 className="contest-title" style={{ fontSize: "2rem", marginBottom: "12px" }}>{contest.title}</h1>
        <p className="contest-desc" style={{ fontSize: "1.05rem", marginBottom: "24px", opacity: 0.9 }}>{contest.description}</p>

        <div className="contest-participants-info" style={{ marginBottom: "28px" }}>
          <UsersIcon size={16} className="mr-1 text-muted" />
          <span>
            <strong>{contest.participants.length}</strong> registered participants
          </span>
        </div>

        {/* Interactive Dashboard Tabs */}
        <div className="contest-inner-navigation" style={{ marginTop: "0px" }}>
          <div className="contest-tab-buttons" style={{ marginBottom: "20px" }}>
            {!(status === "ended" && role === "student") && (
              <button
                type="button"
                className={`contest-tab-btn ${displayTab === "challenges" ? "active" : ""}`}
                onClick={() => setActiveTabState("challenges")}
              >
                Challenges ({contest.problems.length})
              </button>
            )}
            <button
              type="button"
              className={`contest-tab-btn ${displayTab === "leaderboard" ? "active" : ""}`}
              onClick={() => setActiveTabState("leaderboard")}
            >
              <TrophyIcon size={14} className="mr-1" />
              {status === "ended" ? "Final Standings" : "Live Standings"}
            </button>
          </div>

          {displayTab === "challenges" ? (
            <div className="contest-problems-subsection">
              <div className="contest-problems-mini-list">
                {contest.problems.map((pId, idx) => {
                  const p = problems.find((prob) => prob.id === pId);
                  return p ? (
                    <button
                      key={pId}
                      type="button"
                      className="contest-prob-btn"
                      onClick={() => onSelectProblem(pId)}
                      style={{ padding: "16px 20px" }}
                    >
                      <span className="prob-index font-mono" style={{ fontSize: "1.1rem" }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="prob-title" style={{ fontSize: "1rem" }}>{p.title}</span>
                      <span className="prob-points font-mono" style={{ fontSize: "0.95rem" }}>
                        {p.score} pts
                      </span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <div className="contest-leaderboard-subsection">
              {leaderboard.length === 0 ? (
                <div className="empty-leaderboard font-medium">
                  Scoreboard is empty. Be the first to submit code!
                </div>
              ) : (
                (() => {
                  const boardHeaders = [
                    "Rank",
                    "Competitor",
                    ...contest.problems.map((_, idx) => String.fromCharCode(65 + idx)),
                    "Score",
                    "Penalty"
                  ];

                  const boardColumnClasses = [
                    "col-rank",
                    "col-user",
                    ...contest.problems.map(() => "col-prob-col"),
                    "col-score",
                    "col-penalty"
                  ];

                  const boardColumnAlignments: ("left" | "center" | "right")[] = [
                    "left",
                    "left",
                    ...contest.problems.map(() => "center" as const),
                    "center",
                    "center"
                  ];

                  const boardRows = leaderboard.map((row, rIdx) => [
                    <span key={`rank-${row.username}`} className="font-mono font-medium">
                      #{rIdx + 1}
                    </span>,
                    <span key={`user-${row.username}`} className="font-medium">
                      {row.username}
                    </span>,
                    ...contest.problems.map((pId) => {
                      const stat = row.problemStats[pId];
                      if (!stat || stat.attempts === 0) {
                        return {
                          className: "text-center font-mono text-muted",
                          content: "-"
                        };
                      }
                      return {
                        className: `text-center font-mono text-xs ${stat.solved ? "score-solved" : "score-failed"}`,
                        content: (
                          <div key={`stat-${pId}`}>
                            <div className="score-val">+{stat.score}</div>
                            <div className="attempt-val">
                              {stat.attempts} {stat.attempts === 1 ? "try" : "tries"}
                            </div>
                            {stat.solved && (
                              <div className="time-val">{stat.timeTaken}m</div>
                            )}
                          </div>
                        )
                      };
                    }),
                    <span key={`score-${row.username}`} className="font-mono font-medium text-green">
                      {row.totalPoints}
                    </span>,
                    <span key={`penalty-${row.username}`} className="font-mono text-muted text-sm">
                      {row.totalPenalty}m
                    </span>
                  ]);

                  const boardRowKeys = leaderboard.map(row => row.username);
                  const boardRowClasses = leaderboard.map(row => row.username === username ? "scoreboard-self-row" : "");

                  return (
                    <div className="table-responsive">
                      <Table
                        headers={boardHeaders}
                        rows={boardRows}
                        rowKeys={boardRowKeys}
                        rowClasses={boardRowClasses}
                        columnAlignments={boardColumnAlignments}
                        columnClasses={boardColumnClasses}
                        className="contest-scoreboard-table"
                      />
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Admin Supervision Actions */}
        {(role === "admin" || (role === "teacher" && contest.createdBy === username)) && (
          <div className="contest-host-actions-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", marginTop: "24px" }}>
            <div className="admin-registered-status" style={{ marginBottom: "12px" }}>
              Instructor Management Mode
            </div>
            <div className="host-action-buttons" style={{ maxWidth: "480px" }}>
              {status === "upcoming" && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setContestToEdit(contest)}
                  >
                    Edit Contest
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    Cancel Contest
                  </button>
                </>
              )}
              {status === "ongoing" && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    Cancel Contest
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleEndNow}
                  >
                    End Contest Now
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {contestToEdit && (
        <ContestForm
          onClose={() => setContestToEdit(undefined)}
          problems={problems}
          contestToEdit={contestToEdit}
        />
      )}
    </div>
  );
}
