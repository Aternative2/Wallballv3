import React, { useRef, useEffect, useState } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useWebSocket } from '../../hooks/useWebSocket';
import PoseOverlay from './PoseOverlay';
import StatsPanel from '../Stats/StatsPanel';
import CameraSelector from './CameraSelector';
import DebugOverlay from './DebugOverlay';
import VideoUpload from './VideoUpload';
import VideoControls from './VideoControls';
import DisplayToggle from './DisplayToggle';
import { ProModeStats, ProModeAnalysis } from '../../types';

export default function CameraView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [stats, setStats] = useState<ProModeStats>({
    total_reps: 0,
    valid_squats: 0,
    invalid_squats: 0,
    valid_throws: 0,
    invalid_throws: 0,
    total_wallball_reps: 0
  });
  const [currentDepth, setCurrentDepth] = useState<number | null>(null);
  const [phase, setPhase] = useState('READY');
  const [state, setState] = useState<string>('READY');
  const [feedback, setFeedback] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [ballDetected, setBallDetected] = useState<boolean | null>(null);
  const [ballHeight, setBallHeight] = useState<number | null>(null);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [hipAngle, setHipAngle] = useState<number | null>(null);
  const [ankleAngle, setAnkleAngle] = useState<number | null>(null);
  const [side, setSide] = useState<'left' | 'right' | null>(null);
  const [repCount, setRepCount] = useState<number | null>(null);
  const [repValid, setRepValid] = useState<boolean | null>(null);
  const [repErrors, setRepErrors] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showPose, setShowPose] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { 
    videoRef, 
    pose, 
    isLoading, 
    error, 
    cameras, 
    selectedCamera, 
    switchCamera,
    poseDetected,
    processVideoFile
  } = useMediaPipe();
  
  const { isConnected, sendMessage, lastMessage } = useWebSocket(
    `ws://127.0.0.1:8000/ws/session/${sessionId}`
  );

  // Reset stats when switching cameras
  const resetStats = () => {
    setStats({
      total_reps: 0,
      valid_squats: 0,
      invalid_squats: 0,
      valid_throws: 0,
      invalid_throws: 0,
      total_wallball_reps: 0
    });
    setCurrentDepth(null);
    setPhase('READY');
    setState('READY');
    setFeedback([]);
    setConfidence(null);
    setBallDetected(null);
    setBallHeight(null);
    setKneeAngle(null);
    setHipAngle(null);
    setAnkleAngle(null);
    setSide(null);
    setRepCount(null);
    setRepValid(null);
    setRepErrors([]);
  };

  // Monitor isVideoFile changes
  useEffect(() => {
    console.log('[CameraView] isVideoFile changed:', isVideoFile);
  }, [isVideoFile]);

  // Draw video frame to canvas
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let animationFrameId: number;

    console.log('[CameraView] draw loop started. isVideoFile:', isVideoFile, 'selectedCamera:', selectedCamera);

    const drawFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Skip frames for performance (process every 2nd frame)
        frameCount++;
        if (frameCount % 2 === 0) {
          // Clear and draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Save context
          ctx.save();
          
          // Only apply mirror effect for live camera feed
          if (!isVideoFile && selectedCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          
          // Draw video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Restore context
          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      console.log('[CameraView] draw loop stopped. isVideoFile:', isVideoFile, 'selectedCamera:', selectedCamera);
    };
  }, [videoRef, isVideoFile, selectedCamera]);

  // Update video time
  useEffect(() => {
    if (!videoRef.current || !isVideoFile) return;

    const video = videoRef.current;
    
    const updateTime = () => {
      setVideoTime(video.currentTime);
      setVideoDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateTime);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateTime);
    };
  }, [videoRef, isVideoFile]);

  // Send pose data to backend (throttled)
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
      const data: ProModeAnalysis = lastMessage.data;
      
      // Update basic fields
      setPhase(data.phase || 'READY');
      setCurrentDepth(data.angle ? Math.round(data.angle) : null);
      
      // Update Pro mode specific fields
      if (data.state) setState(data.state);
      if (data.feedback) setFeedback(data.feedback);
      if (data.confidence !== undefined) setConfidence(data.confidence);
      if (data.ball_detected !== undefined) setBallDetected(data.ball_detected);
      if (data.ball_height !== undefined) setBallHeight(data.ball_height);
      if (data.knee_angle !== undefined) setKneeAngle(data.knee_angle);
      if (data.hip_angle !== undefined) setHipAngle(data.hip_angle);
      if (data.ankle_angle !== undefined) setAnkleAngle(data.ankle_angle);
      if (data.side) setSide(data.side);
      if (data.rep_count !== undefined) setRepCount(data.rep_count);
      if (data.rep_valid !== undefined) setRepValid(data.rep_valid);
      if (data.rep_errors) setRepErrors(data.rep_errors);
      
      // Update stats if provided
      if (data.stats) {
        setStats(data.stats);
      }
    }
  }, [lastMessage]);

  // Toggle debug with 'D' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const handleVideoSelect = (file: File) => {
    setIsVideoFile(true);
    setIsPlaying(true);
    processVideoFile(file);
    resetStats();
  };

  const handleCameraSwitch = (deviceId: string) => {
    setIsVideoFile(false);
    switchCamera(deviceId);
    resetStats();
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleBackToCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      // First stop any ongoing video playback
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.srcObject = null;
      }

      // Reset video-related states
      setIsVideoFile(false);
      setIsPlaying(true);
      setVideoTime(0);
      setVideoDuration(0);

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Switch back to camera
      await switchCamera(selectedCamera);
      resetStats();
      setCameraLoading(false);
    } catch (error: any) {
      setCameraLoading(false);
      setCameraError('Failed to re-initialize camera. Please check your device and permissions.');
      console.error('Error switching back to camera:', error);
    }
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (cameraError) {
    return <div className="error">{cameraError}</div>;
  }

  return (
    <div className="camera-container">
      {cameraLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Re-initializing camera...</span>
        </div>
      )}
      <div className="video-wrapper">
        <video 
          ref={videoRef} 
          className="hidden" 
          style={{ display: 'none' }}
          autoPlay 
          playsInline
          muted
        />
        <canvas ref={canvasRef} />
        {pose && showPose && <PoseOverlay pose={pose} canvasRef={canvasRef} isVideoFile={isVideoFile} />}
      </div>
      
      <StatsPanel 
        stats={stats} 
        currentDepth={currentDepth} 
        phase={phase}
        isConnected={isConnected}
        state={state}
        feedback={feedback}
        confidence={confidence}
        ballDetected={ballDetected}
        ballHeight={ballHeight}
        kneeAngle={kneeAngle}
        hipAngle={hipAngle}
        ankleAngle={ankleAngle}
        side={side}
        repCount={repCount}
        repValid={repValid}
        repErrors={repErrors}
        showPose={showPose}
      />
      
      <CameraSelector
        cameras={cameras}
        selectedCamera={selectedCamera}
        onCameraChange={handleCameraSwitch}
      />
      
      <VideoUpload onVideoSelect={handleVideoSelect} />
      
      <DisplayToggle 
        showPose={showPose}
        onToggle={() => setShowPose(!showPose)}
      />
      
      {isVideoFile && (
        <VideoControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onBackToCamera={handleBackToCamera}
          currentTime={videoTime}
          duration={videoDuration}
        />
      )}
      
      {showDebug && (
        <DebugOverlay
          poseDetected={poseDetected}
          isConnected={isConnected}
          phase={phase}
        />
      )}
      
      {isLoading && (
        <div className="loading">
          <div>Loading...</div>
        </div>
      )}
      
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        fontSize: '12px',
        color: '#666',
        zIndex: 10
      }}>
        Press 'D' to toggle debug info
      </div>
    </div>
  );
}