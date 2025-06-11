import React from 'react';

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onBackToCamera: () => void;
  currentTime?: number;
  duration?: number;
}

export default function VideoControls({ 
  isPlaying, 
  onPlayPause, 
  onBackToCamera,
  currentTime = 0,
  duration = 0 
}: VideoControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px 24px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <button
        onClick={onPlayPause}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          minWidth: '80px'
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <span style={{ color: '#888', fontSize: '14px' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      
      <button
        onClick={onBackToCamera}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        Back to Camera
      </button>
    </div>
  );
}