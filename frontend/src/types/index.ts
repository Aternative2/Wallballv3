export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Pose {
  landmarks: Point3D[];
  timestamp: number;
}

export interface Stats {
  totalReps: number;
  validReps: number;
  invalidReps: number;
}

export interface RepData {
  repNumber: number;
  valid: boolean;
  maxDepth: number;
  maxBallHeight?: number;
  duration: number;
  errors: string[];
  timestamp: Date;
}

// Pro mode types
export interface ProModeStats {
  total_reps: number;
  valid_squats: number;
  invalid_squats: number;
  valid_throws: number;
  invalid_throws: number;
  total_wallball_reps: number;
}

export interface ProModeAnalysis {
  phase: string;
  angle?: number;
  stats?: ProModeStats;
  feedback?: string[];
  state?: string;
  confidence?: number;
  ball_detected?: boolean;
  ball_height?: number;
  knee_angle?: number;
  hip_angle?: number;
  ankle_angle?: number;
  side?: 'left' | 'right';
  rep_count?: number;
  rep_valid?: boolean;
  rep_errors?: string[];
}

export interface WebSocketMessage {
  type: string;
  data: any;
}