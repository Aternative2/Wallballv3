import React from 'react';

interface StatsPanelProps {
  stats: {
    total_reps: number;
    valid_squats: number;
    invalid_squats: number;
    valid_throws: number;
    invalid_throws: number;
    total_wallball_reps: number;
  };
  currentDepth: number | null;
  phase: string;
  isConnected?: boolean;
}

export default function StatsPanel({ stats, currentDepth, phase, isConnected }: StatsPanelProps) {
  return (
    <div className="stats-panel">
      <h2>Wall Ball Referee</h2>
      
      {/* Connection Status */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '8px',
        borderRadius: '6px',
        backgroundColor: isConnected ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
        border: `1px solid ${isConnected ? '#4ade80' : '#f87171'}`
      }}>
        <span style={{ 
          color: isConnected ? '#4ade80' : '#f87171',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </span>
      </div>
      
      <div className="stat-item">
        <span>Total Wall Ball Reps:</span>
        <span className="total">{stats.total_wallball_reps}</span>
      </div>
      
      <div className="stat-item">
        <span>Total Squats:</span>
        <span className="total">{stats.total_reps}</span>
      </div>
      
      <div className="stat-item">
        <span>Valid Squats:</span>
        <span className="valid">{stats.valid_squats}</span>
      </div>
      
      <div className="stat-item">
        <span>Invalid Squats:</span>
        <span className="invalid">{stats.invalid_squats}</span>
      </div>
      
      <div className="stat-item">
        <span>Valid Throws:</span>
        <span className="valid">{stats.valid_throws}</span>
      </div>
      
      <div className="stat-item">
        <span>Invalid Throws:</span>
        <span className="invalid">{stats.invalid_throws}</span>
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '20px', 
        borderTop: '1px solid #333' 
      }}>
        <div className="stat-item">
          <span>Current Depth:</span>
          <span style={{ 
            color: currentDepth && currentDepth >= 90 ? '#4ade80' : '#fbbf24',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {currentDepth !== null ? `${currentDepth}°` : '--'}
          </span>
        </div>
      </div>
      
      <div className="phase-indicator">
        Phase: {phase}
      </div>
    </div>
  );
}