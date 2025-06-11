import React from 'react';

interface CameraSelectorProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  onCameraChange: (deviceId: string) => void;
}

export default function CameraSelector({ cameras, selectedCamera, onCameraChange }: CameraSelectorProps) {
  if (cameras.length <= 1) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10
    }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
        Camera:
      </label>
      <select
        value={selectedCamera}
        onChange={(e) => onCameraChange(e.target.value)}
        style={{
          width: '200px',
          padding: '8px',
          borderRadius: '6px',
          background: '#1f1f1f',
          color: 'white',
          border: '1px solid #333',
          fontSize: '14px'
        }}
      >
        {cameras.map((camera, index) => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || `Camera ${index + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}