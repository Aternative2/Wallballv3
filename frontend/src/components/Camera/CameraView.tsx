import React, { useRef, useEffect, useState } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useWebSocket } from '../../hooks/useWebSocket';
import PoseOverlay from './PoseOverlay';
import StatsPanel from '../Stats/StatsPanel';

export default function CameraView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [stats, setStats] = useState({
    totalReps: 0,
    validReps: 0,
    invalidReps: 0
  });
  const [currentDepth, setCurrentDepth] = useState<number | null>(null);
  const [phase, setPhase] = useState('READY');

  const { videoRef, pose, isLoading, error } = useMediaPipe();
  const { isConnected, sendMessage, lastMessage } = useWebSocket(
    `ws://localhost:8000/ws/session/${sessionId}`
  );

  // Send pose data to backend
  useEffect(() => {
    if (pose && isConnected) {
      sendMessage({
        type: 'pose',
        data: {
          landmarks: pose,
          timestamp: Date.now()
        }
      });
    }
  }, [pose, isConnected, sendMessage]);

  // Handle backend responses
  useEffect(() => {
    if (lastMessage?.type === 'analysis') {
      const { phase, angle, stats } = lastMessage.data;
      setPhase(phase);
      setCurrentDepth(angle ? Math.round(angle) : null);
      setStats(stats);
    }
  }, [lastMessage]);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
  <div
    className="camera-container"
    style={{ position: 'relative', width: 1280, height: 720, overflow: 'hidden' }}
  >
    <video
      ref={videoRef}
      width={1280}
      height={720}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        display: 'block',
      }}
      autoPlay
      muted
      playsInline
    />
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
    {pose && <PoseOverlay pose={pose} canvasRef={canvasRef} />}
    {/* Overlay UI */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        zIndex: 3,
        background: 'rgba(255,255,255,0.8)',
        padding: '1rem',
      }}
    >
      <StatsPanel stats={stats} currentDepth={currentDepth} phase={phase} />
      {isLoading && <div className="loading">Loading camera...</div>}
    </div>
  </div>
);
}