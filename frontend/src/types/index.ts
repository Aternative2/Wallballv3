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