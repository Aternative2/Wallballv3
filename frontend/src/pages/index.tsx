import React from 'react';
import CameraView from '../components/Camera/CameraView';

export default function Home() {
  return (
    <div className="app-container">
      <div className="app-title">Wall Ball counter</div>
      <CameraView />
    </div>
  );
}
