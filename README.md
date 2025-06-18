# Wall Ball Referee v3

A real-time wall ball squat analysis application with pose detection and form validation.

## 🎯 Current Checkpoint - Adjusted Thresholds

### System Status
- ✅ Backend running on `http://127.0.0.1:8000`
- ✅ Frontend running on `http://localhost:3001`
- ✅ WebSocket connection working
- ✅ State machine implemented with Pro mode
- ✅ Thresholds adjusted for easier state 3 detection

### Key Threshold Adjustments Made
```python
# Current Knee Angle Ranges (backend/app/services/thresholds.py)
KNEE_ANGLE_RANGES = {
    'NORMAL': (0, 32),    # Standing position
    'TRANS': (35, 50),    # Transition phase
    'PASS': (52, 95)      # Deep squat (state 3) - adjusted from (80, 95)
}

# Form Validation Thresholds
KNEE_THRESH': [50, 65, 95]  # [min_transition, max_transition, max_depth]
```

### State Machine States
- **State 1 (s1)**: Standing position (0-32° knee angle)
- **State 2 (s2)**: Transition phase (35-50° knee angle)
- **State 3 (s3)**: Deep squat (52-95° knee angle) - **Easier to reach now**

### Features Implemented
- Real-time pose detection with MediaPipe
- Pro mode state machine for squat counting
- Form validation with feedback
- WebSocket communication between frontend and backend
- Confidence thresholds and side selection
- Ball detection (framework ready)

## 🚀 Quick Start

1. **Start Backend:**
   ```powershell
   cd backend; uvicorn app.main:app --reload
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend; npm run dev
   ```

3. **Access Application:**
   - Frontend: `http://localhost:3001`
   - Backend API: `http://127.0.0.1:8000`

## 📝 Notes
- PowerShell syntax uses `;` instead of `&&` for command chaining
- State 3 detection threshold lowered from 80° to 52° for easier activation
- WebSocket connection uses `127.0.0.1:8000` for backend communication