import numpy as np

class KalmanFilter:
    """1D Kalman filter for smoothing measurements"""
    def __init__(self, process_noise=0.01, measurement_noise=10):
        self.x = 0  # State estimate
        self.v = 0  # Velocity estimate
        self.P = np.array([[1000, 0], [0, 1000]])  # Covariance matrix
        self.Q = np.array([[process_noise, 0], [0, process_noise]])  # Process noise
        self.R = measurement_noise  # Measurement noise
        self.F = np.array([[1, 1], [0, 1]])  # State transition
        self.H = np.array([1, 0])  # Measurement matrix
        self.initialized = False
    
    def predict(self, dt=1/30):
        self.F[0, 1] = dt
        # Predict state
        x_new = self.F @ np.array([self.x, self.v])
        self.x, self.v = x_new
        # Predict covariance
        self.P = self.F @ self.P @ self.F.T + self.Q
    
    def update(self, measurement):
        if not self.initialized:
            self.x = measurement
            self.initialized = True
            return measurement
        
        # Calculate Kalman gain
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T / S
        
        # Update state
        y = measurement - self.H @ np.array([self.x, self.v])
        update = K * y
        self.x += update[0]
        self.v += update[1]
        
        # Update covariance
        self.P = (np.eye(2) - np.outer(K, self.H)) @ self.P
        
        return self.x
    
    def filter(self, measurement, dt=1/30):
        self.predict(dt)
        return self.update(measurement)