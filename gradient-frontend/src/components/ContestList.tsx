import React, { useState, useEffect } from "react";
import { useGradient } from "../context/GradientContext";
import type { Contest, Submission } from "../context/GradientContext";

import { ContestForm } from "./ContestForm";
import { Table } from "./Table";
import { PlusIcon, ClockIcon, TrophyIcon, UsersIcon } from "./Icons";

interface ContestListProps {
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

export function ContestList({
  onSelectProblem,
}: ContestListProps): JSX.Element {
  const { role, contests, problems, username, joinContest, submissions } =
    useGradient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTabs, setActiveTabs] = useState<
    Record<string, "challenges" | "leaderboard">
  >({});

  const getContestStatus = (c: Contest): "ongoing" | "upcoming" | "ended" => {
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);

    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "ongoing";
  };

  // Helper to calculate contest leaderboard
  const getLeaderboard = (c: Contest) => {
    const contestStart = new Date(c.startTime).getTime();
    const contestEnd = new Date(c.endTime).getTime();

    // Compile list of competitors: all registered participants, plus anyone who submitted during contest window
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
        let timeTaken = 0; // minutes from start

        if (solvedIndex !== -1) {
          // Solved! count attempts up to first Accepted
          attempts = solvedIndex + 1;
          const solvedTime = new Date(
            contestSubs[solvedIndex].createdAt,
          ).getTime();
          timeTaken = Math.max(
            1,
            Math.floor((solvedTime - contestStart) / 60000),
          );
        } else {
          // Attempted but not solved
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
          // Penalty = Time taken + 20 minutes for each incorrect submission before acceptance
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

    // Sort: 1. Total Points (descending) 2. Total Penalty (ascending)
    return standings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.totalPenalty - b.totalPenalty;
    });
  };

  return (
    <div className="contest-page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">Programming Contests</h1>
          <p className="section-subtitle">
            Participate in real-time programming events, track live
            leaderboards, and test your speed.
          </p>
        </div>
        {role === "admin" && !showAddForm && (
          <button
            type="button"
            className="btn btn-primary btn-icon"
            onClick={() => setShowAddForm(true)}
          >
            <PlusIcon size={16} />
            Schedule Contest
          </button>
        )}
      </div>

      <div className="contest-list-panel">
        {contests.length === 0 ? (
          <div className="card empty-state">No contests scheduled.</div>
        ) : (
          <div className="contests-grid-layout">
            {contests.map((c) => {
              const status = getContestStatus(c);
              const isJoined = c.participants.includes(username);
              const activeTab = activeTabs[c.id] || "challenges";
              const leaderboard = getLeaderboard(c);

              return (
                <div
                  key={c.id}
                  className={`card contest-item-card status-${status}`}
                >
                  {/* Contest status metadata */}
                  <div className="contest-card-top">
                    <span className={`badge badge-status-${status}`}>
                      {status.toUpperCase()}
                    </span>
                    <div className="contest-timer-badge">
                      <ClockIcon size={14} className="mr-1" />
                      <ContestTimer contest={c} />
                    </div>
                    <span className="creator-text">
                      Host: <strong>{c.createdBy}</strong>
                    </span>
                  </div>

                  <h2 className="contest-title">{c.title}</h2>
                  <p className="contest-desc">{c.description}</p>

                  <div className="contest-participants-info">
                    <UsersIcon size={16} className="mr-1 text-muted" />
                    <span>
                      <strong>{c.participants.length}</strong> registered
                      participants
                    </span>
                  </div>

                  {/* Interactive Contest Dashboard Mode Tabs (Challenges vs Leaderboard) */}
                  {status !== "upcoming" && (role === "admin" || isJoined) && (
                    <div className="contest-inner-navigation">
                      <div className="contest-tab-buttons">
                        <button
                          type="button"
                          className={`contest-tab-btn ${activeTab === "challenges" ? "active" : ""}`}
                          onClick={() =>
                            setActiveTabs((prev) => ({
                              ...prev,
                              [c.id]: "challenges",
                            }))
                          }
                        >
                          Challenges ({c.problems.length})
                        </button>
                        <button
                          type="button"
                          className={`contest-tab-btn ${activeTab === "leaderboard" ? "active" : ""}`}
                          onClick={() =>
                            setActiveTabs((prev) => ({
                              ...prev,
                              [c.id]: "leaderboard",
                            }))
                          }
                        >
                          <TrophyIcon size={14} className="mr-1" />
                          Live Standings
                        </button>
                      </div>

                      {activeTab === "challenges" ? (
                        <div className="contest-problems-subsection">
                          <div className="contest-problems-mini-list">
                            {c.problems.map((pId, idx) => {
                              const p = problems.find(
                                (prob) => prob.id === pId,
                              );
                              return p ? (
                                <button
                                  key={pId}
                                  type="button"
                                  className="contest-prob-btn"
                                  onClick={() => onSelectProblem(pId)}
                                >
                                  <span className="prob-index font-mono">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="prob-title">{p.title}</span>
                                  <span className="prob-points font-mono">
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
                                ...c.problems.map((_, idx) => String.fromCharCode(65 + idx)),
                                "Score",
                                "Penalty"
                              ];

                              const boardColumnClasses = [
                                "col-rank",
                                "col-user",
                                ...c.problems.map(() => "col-prob-col"),
                                "col-score",
                                "col-penalty"
                              ];

                              const boardColumnAlignments: ("left" | "center" | "right")[] = [
                                "left",
                                "left",
                                ...c.problems.map(() => "center" as const),
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
                                ...c.problems.map((pId) => {
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
                                        <div className="score-val">
                                          +{stat.score}
                                        </div>
                                        <div className="attempt-val">
                                          {stat.attempts} {stat.attempts === 1 ? "try" : "tries"}
                                        </div>
                                        {stat.solved && (
                                          <div className="time-val">
                                            {stat.timeTaken}m
                                          </div>
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
                  )}

                  {/* Registration CTA Actions */}
                  <div className="contest-card-actions">
                    {role === "student" && status !== "ended" && !isJoined && (
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={() => joinContest(c.id)}
                      >
                        Register for Contest
                      </button>
                    )}
                    {role === "student" &&
                      isJoined &&
                      status === "ongoing" &&
                      activeTab === "challenges" && (
                        <div className="badge-registered-status">
                          ✓ Registered & Active
                        </div>
                      )}
                    {role === "student" &&
                      isJoined &&
                      status === "upcoming" && (
                        <div className="badge-registered-status bg-blue">
                          ✓ Registered (Starts Soon)
                        </div>
                      )}
                    {role === "admin" && (
                      <div className="admin-registered-status">
                        Instructor Supervision Mode
                      </div>
                    )}
                    {status === "ended" && (
                      <div className="badge-registered-status bg-grey">
                        Contest Finished
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddForm && role === "admin" && (
        <ContestForm
          onClose={() => setShowAddForm(false)}
          problems={problems}
        />
      )}
    </div>
  );
}
