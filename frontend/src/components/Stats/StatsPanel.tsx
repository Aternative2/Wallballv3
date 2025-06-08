import React from 'react';

interface StatsPanelProps {
  stats: {
    totalReps: number;
    validReps: number;
    invalidReps: number;
  };
  currentDepth: number | null;
  phase: string;
}

export default function StatsPanel({ stats, currentDepth, phase }: StatsPanelProps) {
  return (
    <div className="stats-panel">
      <h2>Wall Ball Referee</h2>
      <div className="stat-item">
        <span>Total Reps:</span>
        <span>{stats.totalReps}</span>
      </div>
      <div className="stat-item">
        <span>Valid:</span>
        <span className="valid">{stats.validReps}</span>
      </div>
      <div className="stat-item">
        <span>Invalid:</span>
        <span className="invalid">{stats.invalidReps}</span>
      </div>
      <div className="stat-item">
        <span>Current Depth:</span>
        <span>{currentDepth || '--'}°</span>
      </div>
      <div className="phase-indicator">
        Phase: {phase}
      </div>
    </div>
  );
}