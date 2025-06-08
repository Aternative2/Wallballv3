import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}

export const useMediaPipe = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pose, setPose] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Load scripts
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
        ];

        for (const src of scripts) {
          await new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Wait for objects to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize pose
        const pose = new window.Pose({
          locateFile: (file: string) => 
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 2,
          smoothLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        pose.onResults((results: any) => {
          setPose(results.poseLandmarks);
        });

        // Start camera
        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              await pose.send({ image: videoRef.current });
            },
            width: 1280,
            height: 720
          });

          await camera.start();
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load MediaPipe');
        setIsLoading(false);
      }
    };

    loadScripts();
  }, []);

  return { videoRef, pose, isLoading, error };
};