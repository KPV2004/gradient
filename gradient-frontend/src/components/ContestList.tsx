import React, { useState, useEffect } from "react";
import { useGradient } from "../context/GradientContext";
import type { Contest } from "../context/GradientContext";

import { ContestForm } from "./ContestForm";
import { Table } from "./Table";
import { PlusIcon, ClockIcon, TrophyIcon, UsersIcon } from "./Icons";

interface ContestListProps {
  readonly onEnterContest: (contestId: string) => void;
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
  onEnterContest,
}: ContestListProps): JSX.Element {
  const { role, contests, problems, username, joinContest } = useGradient();
  const [showAddForm, setShowAddForm] = useState(false);

  const getContestStatus = (c: Contest): "ongoing" | "upcoming" | "ended" => {
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);

    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "ongoing";
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
        {(role === "admin" || role === "teacher") && !showAddForm && (
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

                  <div className="contest-participants-info" style={{ marginBottom: "8px" }}>
                    <UsersIcon size={16} className="mr-1 text-muted" />
                    <span>
                      <strong>{c.participants.length}</strong> registered participants
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="contest-card-actions" style={{ marginTop: "20px" }}>
                    {role === "student" && status !== "ended" && !isJoined && (
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={() => joinContest(c.id)}
                      >
                        Register for Contest
                      </button>
                    )}
                    {role === "student" && isJoined && status === "ongoing" && (
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={() => onEnterContest(c.id)}
                      >
                        Enter Contest
                      </button>
                    )}
                    {role === "student" && isJoined && status === "upcoming" && (
                      <div className="badge-registered-status bg-blue text-center w-full" style={{ padding: "10px 12px" }}>
                        ✓ Registered (Starts Soon)
                      </div>
                    )}
                    {(role === "admin" || role === "teacher") && (
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={() => onEnterContest(c.id)}
                      >
                        Enter / Manage Contest
                      </button>
                    )}
                    {status === "ended" && role === "student" && (
                      <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={() => onEnterContest(c.id)}
                      >
                        View Standings & Results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddForm && (role === "admin" || role === "teacher") && (
        <ContestForm
          onClose={() => setShowAddForm(false)}
          problems={problems}
        />
      )}
    </div>
  );
}
