from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import websocket

# Create FastAPI app
app = FastAPI(title="Wall Ball Referee API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {"message": "Wall Ball Referee API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}