import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Pose: any;
  }
}

export const useMediaPipe = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pose, setPose] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [poseDetected, setPoseDetected] = useState(false);
  const poseRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  // Get available cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedCamera) return;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        
        // Load MediaPipe Pose if not already loaded
        if (!poseRef.current) {
          const scripts = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
          ];

          for (const src of scripts) {
            if (!document.querySelector(`script[src="${src}"]`)) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.crossOrigin = 'anonymous';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 100));

          poseRef.current = new window.Pose({
            locateFile: (file: string) => 
              `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });

          poseRef.current.setOptions({
            modelComplexity: 0, // Lowest complexity for better performance
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          poseRef.current.onResults((results: any) => {
            if (results.poseLandmarks) {
              setPose(results.poseLandmarks);
              setPoseDetected(true);
            } else {
              setPoseDetected(false);
            }
          });
        }

        // Stop existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Get new stream with selected camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedCamera },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Manual frame processing instead of MediaPipe Camera
          const processFrame = async () => {
            if (videoRef.current && poseRef.current && streamRef.current?.active) {
              await poseRef.current.send({ image: videoRef.current });
              animationRef.current = requestAnimationFrame(processFrame);
            }
          };

          processFrame();
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('MediaPipe error:', err);
        setError(err.message || 'Failed to initialize camera');
        setIsLoading(false);
      }
    };

    initializePose();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);

  const switchCamera = (deviceId: string) => {
    setSelectedCamera(deviceId);
  };

  const processVideoFile = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Create video URL
      const videoUrl = URL.createObjectURL(file);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = videoUrl;
        videoRef.current.loop = true;
        
        await videoRef.current.play();

        // Process video frames
        const processVideoFrame = async () => {
          if (videoRef.current && poseRef.current && !videoRef.current.paused) {
            await poseRef.current.send({ image: videoRef.current });
            animationRef.current = requestAnimationFrame(processVideoFrame);
          }
        };

        processVideoFrame();
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Video processing error:', err);
      setError(err.message || 'Failed to process video');
      setIsLoading(false);
    }
  };

  return { 
    videoRef, 
    pose, 
    isLoading, 
    error, 
    cameras, 
    selectedCamera, 
    switchCamera,
    poseDetected,
    processVideoFile
  };
};