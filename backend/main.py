from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict, Any, List
import statistics
from datetime import datetime, timedelta
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="SolarPal API", description="Solar irradiance data API for the Philippines")

# Get allowed origins from environment variable or use defaults
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
else:
    allowed_origins = [
        "http://localhost:3000",  # Next.js default port
        "http://localhost:3001",  # Alternative Next.js port
        "http://localhost:3002",  # Alternative Next.js port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://solarpal-delta.vercel.app",  # Vercel deployment
    ]

print(f"🌐 CORS allowed origins: {allowed_origins}")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
    return {"message": "SolarPal API is running!", "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/keep-alive")
async def keep_alive():
    """Keep-alive endpoint to prevent the service from sleeping."""
    return {
        "status": "alive", 
        "message": "Service is awake",
        "timestamp": datetime.now().isoformat()
    }

# Keep-alive background task
async def self_ping():
    """Ping the service every 10 minutes to keep it awake."""
    while True:
        try:
            await asyncio.sleep(600)  # Wait 10 minutes (600 seconds)
            
            # Get the service URL from environment or use default
            service_url = os.getenv("SERVICE_URL", "https://solarpal.onrender.com")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{service_url}/keep-alive")
                if response.status_code == 200:
                    print(f"✅ Keep-alive ping successful at {datetime.now().isoformat()}")
                else:
                    print(f"⚠️ Keep-alive ping failed with status {response.status_code}")
        except Exception as e:
            print(f"❌ Keep-alive ping error: {e}")

# Start the keep-alive task when the app starts
@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup."""
    print("🚀 Starting SolarPal API...")
    print(f"🌐 CORS allowed origins: {allowed_origins}")
    
    # Only start keep-alive in production (when SERVICE_URL is set)
    if os.getenv("SERVICE_URL"):
        print("🔄 Starting keep-alive background task...")
        asyncio.create_task(self_ping())
    else:
        print("🏠 Running in development mode - keep-alive disabled")

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

@app.get("/api/solar-zones")
async def get_solar_zones() -> Dict[str, Any]:
    """
    Get dynamic solar zones based on NASA POWER API data for Philippines regions.
    This replaces hardcoded zones with real-time solar irradiance data.
    """
    # Define strategic sampling points across Philippines regions
    # These represent diverse geographic and climatic areas
    sampling_points = [
        # Luzon regions
        {"name": "Metro Manila", "lat": 14.5995, "lng": 120.9842, "region": "NCR"},
        {"name": "Central Luzon Plains", "lat": 15.3, "lng": 120.9, "region": "Central Luzon"},
        {"name": "Ilocos Coast", "lat": 17.3, "lng": 120.6, "region": "Ilocos"},
        {"name": "Cagayan Valley", "lat": 17.2, "lng": 121.8, "region": "Cagayan Valley"},
        {"name": "Cordillera Mountains", "lat": 16.8, "lng": 121.0, "region": "CAR"},
        {"name": "Bicol Peninsula", "lat": 13.3, "lng": 123.7, "region": "Bicol"},
        {"name": "Southern Tagalog", "lat": 14.1, "lng": 121.5, "region": "CALABARZON"},
        
        # Visayas regions
        {"name": "Western Visayas", "lat": 11.2, "lng": 122.5, "region": "Western Visayas"},
        {"name": "Central Visayas", "lat": 10.3, "lng": 123.9, "region": "Central Visayas"},
        {"name": "Eastern Visayas", "lat": 11.6, "lng": 125.0, "region": "Eastern Visayas"},
        {"name": "Negros Island", "lat": 10.3, "lng": 123.1, "region": "Negros"},
        {"name": "Bohol Island", "lat": 9.8, "lng": 124.1, "region": "Bohol"},
        
        # Mindanao regions
        {"name": "Northern Mindanao", "lat": 8.7, "lng": 124.7, "region": "Northern Mindanao"},
        {"name": "Davao Region", "lat": 7.3, "lng": 125.7, "region": "Davao"},
        {"name": "SOCCSKSARGEN", "lat": 6.7, "lng": 124.8, "region": "SOCCSKSARGEN"},
        {"name": "Caraga Region", "lat": 9.0, "lng": 125.8, "region": "Caraga"},
        {"name": "Zamboanga Peninsula", "lat": 7.8, "lng": 123.1, "region": "Zamboanga"},
        {"name": "ARMM Region", "lat": 7.2, "lng": 124.3, "region": "ARMM"},
        
        # Island provinces
        {"name": "Palawan", "lat": 9.8, "lng": 118.7, "region": "MIMAROPA"},
        {"name": "Mindoro", "lat": 13.0, "lng": 121.0, "region": "Mindoro"},
        {"name": "Masbate", "lat": 12.4, "lng": 123.6, "region": "Masbate"}
    ]
    
    try:
        # Fetch solar data for all sampling points concurrently
        async with httpx.AsyncClient(timeout=45.0) as client:
            tasks = []
            for point in sampling_points:
                task = fetch_solar_data_for_point(client, point)
                tasks.append(task)
            
            # Execute all requests concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and create dynamic zones
            zones = []
            successful_results = []
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    print(f"Error fetching data for {sampling_points[i]['name']}: {result}")
                    continue
                    
                if result:
                    successful_results.append(result)
                    zones.append(create_zone_from_data(result))
            
            # Calculate statistics
            if successful_results:
                scores = [r['solar_score'] for r in successful_results]
                irradiances = [r['avg_irradiance'] for r in successful_results]
                
                stats = {
                    "total_zones": len(zones),
                    "avg_solar_score": round(statistics.mean(scores), 1),
                    "avg_irradiance": round(statistics.mean(irradiances), 2),
                    "max_score": max(scores),
                    "min_score": min(scores),
                    "last_updated": datetime.now().isoformat(),
                    "data_source": "NASA POWER API"
                }
            else:
                raise HTTPException(status_code=503, detail="Unable to fetch solar data for any regions")
            
            return {
                "zones": zones,
                "statistics": stats,
                "metadata": {
                    "description": "Dynamic solar zones based on real-time NASA POWER API data",
                    "update_frequency": "Real-time based on last 30 days of data",
                    "coverage": "Philippines archipelago strategic sampling points"
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate solar zones: {str(e)}")

async def fetch_solar_data_for_point(client: httpx.AsyncClient, point: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch solar data for a specific sampling point."""
    try:
        # Calculate date range (last 30 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        
        # NASA POWER API URL
        nasa_url = (
            "https://power.larc.nasa.gov/api/temporal/daily/point"
            f"?parameters=ALLSKY_SFC_SW_DWN"
            f"&community=RE"
            f"&longitude={point['lng']}"
            f"&latitude={point['lat']}"
            f"&start={start_str}"
            f"&end={end_str}"
            f"&format=JSON"
        )
        
        response = await client.get(nasa_url)
        response.raise_for_status()
        
        data = response.json()
        daily_values = data["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
        
        # Convert to list and calculate average
        irradiance_values = [float(value) for value in daily_values.values() if value != -999.0]
        
        if not irradiance_values:
            return None
            
        avg_irradiance = statistics.mean(irradiance_values)
        solar_analysis = calculate_solar_score(avg_irradiance, irradiance_values)
        
        return {
            "name": point["name"],
            "region": point["region"],
            "lat": point["lat"],
            "lng": point["lng"],
            "avg_irradiance": round(avg_irradiance, 2),
            "solar_score": solar_analysis["score"],
            "rating": solar_analysis["rating"],
            "recommendation": solar_analysis["recommendation"],
            "consistency_score": solar_analysis["consistency_score"],
            "min_irradiance": solar_analysis["min_irradiance"],
            "max_irradiance": solar_analysis["max_irradiance"],
            "data_points": len(irradiance_values)
        }
        
    except Exception as e:
        print(f"Error fetching data for {point['name']}: {e}")
        return None

def create_zone_from_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a zone object from solar data."""
    # Determine zone type based on solar score
    if data["solar_score"] >= 85:
        zone_type = "excellent"
        color = "#22c55e"
    elif data["solar_score"] >= 70:
        zone_type = "good" 
        color = "#eab308"
    elif data["solar_score"] >= 55:
        zone_type = "fair"
        color = "#f97316"
    else:
        zone_type = "low"
        color = "#ef4444"
    
    # Create approximate zone boundaries (±0.5 degrees around sampling point)
    lat, lng = data["lat"], data["lng"]
    coordinates = [
        [lat + 0.5, lng - 0.5],
        [lat + 0.5, lng + 0.5], 
        [lat - 0.5, lng + 0.5],
        [lat - 0.5, lng - 0.5]
    ]
    
    return {
        "id": f"nasa-{data['region'].lower().replace(' ', '-')}",
        "name": data["name"],
        "region": data["region"],
        "type": zone_type,
        "color": color,
        "score": data["solar_score"],
        "coordinates": coordinates,
        "center": [lat, lng],
        "avg_irradiance": data["avg_irradiance"],
        "rating": data["rating"],
        "recommendation": data["recommendation"],
        "consistency_score": data["consistency_score"],
        "min_irradiance": data["min_irradiance"],
        "max_irradiance": data["max_irradiance"],
        "data_source": "NASA POWER API",
        "last_updated": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)