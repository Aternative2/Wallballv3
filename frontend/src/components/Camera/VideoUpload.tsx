import React, { useRef } from 'react';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

export default function VideoUpload({ onVideoSelect }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10
    }}>
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '200px',
          padding: '10px',
          borderRadius: '6px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
        onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
      >
        Upload Video File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}