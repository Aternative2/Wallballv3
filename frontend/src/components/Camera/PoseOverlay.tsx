import React, { useEffect } from 'react';

interface PoseOverlayProps {
  pose: any;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isVideoFile?: boolean;
}

export default function PoseOverlay({ pose, canvasRef, isVideoFile = false }: PoseOverlayProps) {
  useEffect(() => {
    if (!canvasRef.current || !pose) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear previous overlay
    ctx.save();
    
    // Apply mirroring for camera (not for video files)
    if (!isVideoFile) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

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
        ctx.moveTo(pose[start].x * width, pose[start].y * height);
        ctx.lineTo(pose[end].x * width, pose[end].y * height);
        ctx.stroke();
      }
    });

    // Draw joints
    ctx.fillStyle = '#ff0000';
    pose.forEach((landmark: any) => {
      if (landmark && landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    ctx.restore();
  }, [pose, canvasRef, isVideoFile]);

  return null;
}