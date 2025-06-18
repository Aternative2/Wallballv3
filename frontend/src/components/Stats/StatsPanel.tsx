import React from 'react';
import { ProModeStats } from '../../types';

interface StatsPanelProps {
  stats: ProModeStats;
  currentDepth: number | null;
  phase: string;
  isConnected?: boolean;
  state?: string;
  feedback?: string[];
  confidence?: number | null;
  ballDetected?: boolean | null;
  ballHeight?: number | null;
  kneeAngle?: number | null;
  hipAngle?: number | null;
  ankleAngle?: number | null;
  side?: 'left' | 'right' | null;
  repCount?: number | null;
  repValid?: boolean | null;
  repErrors?: string[];
  showPose?: boolean;
}

export default function StatsPanel({ 
  stats, 
  currentDepth, 
  phase, 
  isConnected,
  state,
  feedback = [],
  confidence,
  ballDetected,
  ballHeight,
  kneeAngle,
  hipAngle,
  ankleAngle,
  side,
  repCount,
  repValid,
  repErrors = [],
  showPose = true
}: StatsPanelProps) {
  // Simple counter interface when pose is hidden
  if (!showPose) {
    return (
      <div className="simple-counter">
        <h3>Wall Ball Counter</h3>
        
        <div className="simple-stat-item">
          <span>Total Wall Ball Reps</span>
          <span className="simple-total">{stats.total_wallball_reps}</span>
        </div>
        
        <div className="simple-stat-item">
          <span>Valid Squats</span>
          <span className="simple-valid">{stats.valid_squats}</span>
        </div>
        
        <div className="simple-stat-item">
          <span>Invalid Squats</span>
          <span className="simple-invalid">{stats.invalid_squats}</span>
        </div>
        
        <div className="simple-stat-item">
          <span>Valid Throws</span>
          <span className="simple-valid">{stats.valid_throws}</span>
        </div>
        
        <div className="simple-stat-item">
          <span>Invalid Throws</span>
          <span className="simple-invalid">{stats.invalid_throws}</span>
        </div>
      </div>
    );
  }

  // Full stats panel when pose is shown
  return (
    <div className="stats-panel">
      <h2>Wall Ball Referee - Pro Mode</h2>
      
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

      {/* State and Phase */}
      <div style={{ marginBottom: '20px' }}>
        <div className="stat-item">
          <span>State:</span>
          <span style={{ 
            color: state === 'COUNTING' ? '#4ade80' : 
                   state === 'READY' ? '#fbbf24' : '#f87171',
            fontWeight: 'bold'
          }}>
            {state || 'READY'}
          </span>
        </div>
        <div className="stat-item">
          <span>Phase:</span>
          <span style={{ fontWeight: 'bold' }}>{phase}</span>
        </div>
        {side && (
          <div className="stat-item">
            <span>Side:</span>
            <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{side}</span>
          </div>
        )}
      </div>

      {/* Rep Information */}
      {repCount !== null && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: repValid ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `2px solid ${repValid ? '#4ade80' : '#f87171'}`
        }}>
          <div className="stat-item">
            <span>Current Rep:</span>
            <span style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: repValid ? '#4ade80' : '#f87171'
            }}>
              {repCount}
            </span>
          </div>
          <div className="stat-item">
            <span>Rep Status:</span>
            <span style={{ 
              color: repValid ? '#4ade80' : '#f87171',
              fontWeight: 'bold'
            }}>
              {repValid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          {repErrors.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#f87171' }}>Errors:</span>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px', color: '#f87171' }}>
                {repErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Angles */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Joint Angles</h3>
        <div className="stat-item">
          <span>Knee Angle:</span>
          <span style={{ 
            color: kneeAngle && kneeAngle >= 90 ? '#4ade80' : '#fbbf24',
            fontWeight: 'bold'
          }}>
            {kneeAngle !== null && kneeAngle !== undefined ? `${Math.round(kneeAngle)}°` : '--'}
          </span>
        </div>
        <div className="stat-item">
          <span>Hip Angle:</span>
          <span style={{ fontWeight: 'bold' }}>
            {hipAngle !== null && hipAngle !== undefined ? `${Math.round(hipAngle)}°` : '--'}
          </span>
        </div>
        <div className="stat-item">
          <span>Ankle Angle:</span>
          <span style={{ fontWeight: 'bold' }}>
            {ankleAngle !== null && ankleAngle !== undefined ? `${Math.round(ankleAngle)}°` : '--'}
          </span>
        </div>
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

      {/* Ball Detection */}
      {ballDetected !== null && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Ball Detection</h3>
          <div className="stat-item">
            <span>Ball Detected:</span>
            <span style={{ 
              color: ballDetected ? '#4ade80' : '#f87171',
              fontWeight: 'bold'
            }}>
              {ballDetected ? 'YES' : 'NO'}
            </span>
          </div>
          {ballHeight !== null && ballHeight !== undefined && (
            <div className="stat-item">
              <span>Ball Height:</span>
              <span style={{ fontWeight: 'bold' }}>
                {Math.round(ballHeight)}px
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confidence */}
      {confidence !== null && confidence !== undefined && (
        <div style={{ marginBottom: '20px' }}>
          <div className="stat-item">
            <span>Confidence:</span>
            <span style={{ 
              color: confidence >= 0.7 ? '#4ade80' : confidence >= 0.5 ? '#fbbf24' : '#f87171',
              fontWeight: 'bold'
            }}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          borderRadius: '6px',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid #fbbf24'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Feedback</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            {feedback.map((item, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
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
    </div>
  );
}