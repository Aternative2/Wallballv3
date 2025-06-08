import React, { useEffect } from 'react';

interface PoseOverlayProps {
  pose: any;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function PoseOverlay({ pose, canvasRef }: PoseOverlayProps) {
  useEffect(() => {
    if (!canvasRef.current || !pose) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw skeleton connections
    const connections = [
      [11, 13], [13, 15], [12, 14], [14, 16], // Arms
      [11, 12], [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [24, 26], [26, 28], // Legs
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      if (pose[start] && pose[end]) {
        ctx.beginPath();
        ctx.moveTo(pose[start].x * 1280, pose[start].y * 720);
        ctx.lineTo(pose[end].x * 1280, pose[end].y * 720);
        ctx.stroke();
      }
    });

    // Draw joints
    ctx.fillStyle = '#ff0000';
    pose.forEach((landmark: any) => {
      if (landmark) {
        ctx.beginPath();
        ctx.arc(landmark.x * 1280, landmark.y * 720, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [pose, canvasRef]);

  return null;
}
