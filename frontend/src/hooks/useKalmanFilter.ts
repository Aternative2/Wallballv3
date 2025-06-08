import { useRef } from 'react';

class KalmanFilter {
  private x = 0;
  private v = 0;
  private P = [[1000, 0], [0, 1000]];
  private Q = [[0.01, 0], [0, 0.01]];
  private R = 10;
  private initialized = false;

  filter(measurement: number, dt = 1/30): number {
    if (!this.initialized) {
      this.x = measurement;
      this.initialized = true;
      return measurement;
    }

    // Predict
    const F = [[1, dt], [0, 1]];
    this.x = F[0][0] * this.x + F[0][1] * this.v;
    this.v = F[1][0] * this.x + F[1][1] * this.v;

    // Update
    const H = [1, 0];
    const S = H[0] * this.P[0][0] + this.R;
    const K = [this.P[0][0] / S, this.P[1][0] / S];
    
    const y = measurement - this.x;
    this.x += K[0] * y;
    this.v += K[1] * y;

    return this.x;
  }
}

export const useKalmanFilter = () => {
  const filterRef = useRef(new KalmanFilter());
  
  return {
    filter: (value: number) => filterRef.current.filter(value)
  };
};