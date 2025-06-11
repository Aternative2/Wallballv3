import React from 'react';

interface DebugOverlayProps {
  poseDetected: boolean;
  isConnected: boolean;
  phase: string;
  frameCount?: number;
}

export default function DebugOverlay({ poseDetected, isConnected, phase, frameCount = 0 }: DebugOverlayProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '12px',
      fontFamily: 'monospace',
      minWidth: '200px',
      zIndex: 10
    }}>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#888' }}>Pose Detection: </span>
        <span style={{ color: poseDetected ? '#4ade80' : '#f87171' }}>
          {poseDetected ? 'DETECTED' : 'NOT DETECTED'}
        </span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#888' }}>Backend: </span>
        <span style={{ color: isConnected ? '#4ade80' : '#f87171' }}>
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#888' }}>Phase: </span>
        <span style={{ color: '#fbbf24' }}>{phase}</span>
      </div>
      {!poseDetected && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: 'rgba(248, 113, 113, 0.2)',
          borderRadius: '6px',
          border: '1px solid #f87171'
        }}>
          <p style={{ margin: '0 0 4px 0', color: '#f87171', fontWeight: 'bold' }}>
            Tips to detect pose:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#fca5a5' }}>
            <li>Stand 1-3 meters from camera</li>
            <li>Ensure good lighting</li>
            <li>Full body should be visible</li>
            <li>Try moving slowly</li>
          </ul>
        </div>
      )}
    </div>
  );
}