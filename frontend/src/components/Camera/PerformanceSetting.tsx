import React from 'react';

interface PerformanceSettingsProps {
  onSettingsChange: (settings: any) => void;
}

export default function PerformanceSettings({ onSettingsChange }: PerformanceSettingsProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '180px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10,
      fontSize: '14px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#888' }}>Performance</h4>
      
      <label style={{ display: 'block', marginBottom: '8px' }}>
        <input
          type="checkbox"
          onChange={(e) => onSettingsChange({ skipFrames: e.target.checked })}
          defaultChecked={true}
        />
        <span style={{ marginLeft: '8px' }}>Skip frames (2x faster)</span>
      </label>
      
      <label style={{ display: 'block', marginBottom: '8px' }}>
        <input
          type="checkbox"
          onChange={(e) => onSettingsChange({ lowRes: e.target.checked })}
        />
        <span style={{ marginLeft: '8px' }}>Low resolution (640x480)</span>
      </label>
    </div>
  );
}