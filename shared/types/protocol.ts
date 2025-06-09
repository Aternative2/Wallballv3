export interface WebSocketMessage {
  type: 'pose' | 'config' | 'analysis';
  data: any;
}

export interface PoseMessage {
  type: 'pose';
  data: {
    landmarks: Array<{
      x: number;
      y: number;
      z: number;
      visibility?: number;
    }>;
    timestamp: number;
  };
}

export interface AnalysisMessage {
  type: 'analysis';
  data: {
    phase: string;
    angle: number | null;
    stats: {
      totalReps: number;
      validReps: number;
      invalidReps: number;
    };
  };
}