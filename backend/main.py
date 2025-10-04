from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict, Any
import statistics
from datetime import datetime, timedelta

app = FastAPI(title="SolarPal API", description="Solar irradiance data API for the Philippines")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default port
        "http://localhost:3001",  # Alternative Next.js port
        "http://localhost:3002",  # Alternative Next.js port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_solar_score(avg_irradiance: float, daily_values: list) -> dict:
    """Calculate comprehensive solar analysis for the specific location."""
    # Solar scoring based on kWh/m²/day
    # Philippines typical range: 4.5-6.5 kWh/m²/day
    
    # Basic score calculation
    if avg_irradiance >= 5.5:
        score = min(100, int((avg_irradiance / 6.5) * 100))
        rating = "Excellent"
        recommendation = "Outstanding location for solar installation. High energy yield expected."
    elif avg_irradiance >= 4.5:
        score = int((avg_irradiance / 5.5) * 85)
        rating = "Good"
        recommendation = "Suitable for solar installation. Good energy yield expected."
    elif avg_irradiance >= 3.5:
        score = int((avg_irradiance / 4.5) * 65)
        rating = "Fair"
        recommendation = "Moderate potential for solar panels. Consider local factors."
    else:
        score = int((avg_irradiance / 3.5) * 40)
        rating = "Low"
        recommendation = "Limited solar potential. Consider alternative energy sources."
    
    # Calculate additional metrics
    min_irradiance = min(daily_values)
    max_irradiance = max(daily_values)
    consistency = 100 - (((max_irradiance - min_irradiance) / avg_irradiance) * 50)
    
    # Estimated annual energy production (rough estimate)
    # Assuming 1kW system with 85% efficiency
    annual_kwh_estimate = avg_irradiance * 365 * 0.85
    
    return {
        "score": max(0, score),
        "rating": rating,
        "recommendation": recommendation,
        "consistency_score": max(0, min(100, round(consistency, 1))),
        "min_irradiance": round(min_irradiance, 2),
        "max_irradiance": round(max_irradiance, 2),
        "estimated_annual_kwh_per_kw": round(annual_kwh_estimate, 0)
    }

def get_location_name(lat: float, lon: float) -> str:
    """Get a general location name based on coordinates."""
    # Simple mapping for major Philippine cities
    # In production, you'd use a reverse geocoding service
    if 14.5 <= lat <= 14.8 and 120.9 <= lon <= 121.1:
        return "Metro Manila"
    elif 10.2 <= lat <= 10.4 and 123.8 <= lon <= 124.0:
        return "Cebu City"
    elif 7.0 <= lat <= 7.2 and 125.5 <= lon <= 125.7:
        return "Davao City"
    elif 16.3 <= lat <= 16.5 and 120.5 <= lon <= 120.7:
        return "Baguio City"
    else:
        return f"Philippines ({lat:.2f}, {lon:.2f})"

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "SolarPal API is running!", "status": "healthy"}

@app.get("/api/solar")
async def get_solar_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get solar irradiance data for specified coordinates.
    
    Args:
        lat: Latitude (Philippine range: ~5° to 21°N)
        lon: Longitude (Philippine range: ~117° to 127°E)
    
    Returns:
        Solar data including average irradiance, score, and rating
    """
    # Validate coordinates for Philippines
    if not (5.0 <= lat <= 21.0):
        raise HTTPException(status_code=400, detail="Latitude must be within Philippines range (5°-21°N)")
    if not (117.0 <= lon <= 127.0):
        raise HTTPException(status_code=400, detail="Longitude must be within Philippines range (117°-127°E)")
    
    # Calculate date range (last 30 days for recent data)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Format dates for NASA API
    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    
    # NASA POWER API URL
    nasa_url = (
        "https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters=ALLSKY_SFC_SW_DWN"
        f"&community=RE"
        f"&longitude={lon}"
        f"&latitude={lat}"
        f"&start={start_str}"
        f"&end={end_str}"
        f"&format=JSON"
    )
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(nasa_url)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract daily irradiance values
            daily_values = data["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
            
            # Convert to list and calculate average
            irradiance_values = [float(value) for value in daily_values.values() if value != -999.0]
            
            if not irradiance_values:
                raise HTTPException(status_code=404, detail="No valid solar data available for this location")
            
            avg_irradiance = statistics.mean(irradiance_values)
            solar_analysis = calculate_solar_score(avg_irradiance, irradiance_values)
            location = get_location_name(lat, lon)
            
            return {
                "location": location,
                "coordinates": {"latitude": lat, "longitude": lon},
                "avg_irradiance": round(avg_irradiance, 2),
                "solar_score": solar_analysis["score"],
                "rating": solar_analysis["rating"],
                "recommendation": solar_analysis["recommendation"],
                "consistency_score": solar_analysis["consistency_score"],
                "min_irradiance": solar_analysis["min_irradiance"],
                "max_irradiance": solar_analysis["max_irradiance"],
                "estimated_annual_kwh_per_kw": solar_analysis["estimated_annual_kwh_per_kw"],
                "data_points": len(irradiance_values),
                "period": f"{start_str} to {end_str}",
                "analysis_note": f"Solar analysis for precise coordinates: {lat:.6f}°N, {lon:.6f}°E"
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="NASA API request timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"NASA API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)