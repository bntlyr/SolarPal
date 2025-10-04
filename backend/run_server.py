#!/usr/bin/env python3
"""
Simple server runner for SolarPal backend
"""
import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting SolarPal FastAPI server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )