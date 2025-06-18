# Pro mode thresholds for wall ball squat analysis
def get_pro_thresholds():
    """Get thresholds for Pro mode - stricter requirements for proper form"""
    
    # Knee angle ranges for different squat states
    KNEE_ANGLE_RANGES = {
        'NORMAL': (0, 32),    # Standing position
        'TRANS': (35, 50),    # Transition phase (increased upper bound)
        'PASS': (52, 95)      # Deep squat (lowered lower bound from 80 to 70)
    }
    
    thresholds = {
        # Knee angle ranges for state detection
        'KNEE_ANGLE_RANGES': KNEE_ANGLE_RANGES,
        
        # Form validation thresholds
        'HIP_THRESH': [15, 50],      # Hip angle range (degrees)
        'ANKLE_THRESH': 30,          # Maximum ankle angle (prevents knee-over-toe)
        'KNEE_THRESH': [50, 65, 95], # Knee angle ranges [min_transition, max_transition, max_depth]
        
        # Camera alignment and inactivity
        'OFFSET_THRESH': 35.0,       # Maximum offset angle for camera alignment
        'INACTIVE_THRESH': 15.0,     # Seconds of inactivity before reset
        
        # Frame counting
        'CNT_FRAME_THRESH': 50       # Minimum frames for state validation
    }
    
    return thresholds 