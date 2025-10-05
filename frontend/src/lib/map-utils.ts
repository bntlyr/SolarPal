// Philippines map configuration
export const PHILIPPINES_CONFIG = {
  center: {
    lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '12.8797'),
    lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '121.7740'),
  },
  zoom: parseInt(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL || '6'),
  bounds: {
    north: parseFloat(process.env.NEXT_PUBLIC_MAP_MAX_LAT || '21.5'),
    south: parseFloat(process.env.NEXT_PUBLIC_MAP_MIN_LAT || '4.5'),
    east: parseFloat(process.env.NEXT_PUBLIC_MAP_MAX_LNG || '127.0'),
    west: parseFloat(process.env.NEXT_PUBLIC_MAP_MIN_LNG || '116.0'),
  }
};

// Client-side only Leaflet utilities
export const getPhilippinesBounds = () => {
  // Only import and use Leaflet on the client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LatLngBounds } = require('leaflet');
    const bounds = PHILIPPINES_CONFIG.bounds;
    return new LatLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    );
  } catch (error) {
    console.warn('Leaflet not available:', error);
    return null;
  }
};

// Check if coordinates are within Philippines
export const isWithinPhilippines = (lat: number, lng: number): boolean => {
  const bounds = PHILIPPINES_CONFIG.bounds;
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
};

// Solar score color mapping
export const getSolarScoreColor = (score: number): string => {
  if (score >= 85) return '#10b981'; // Green - Excellent
  if (score >= 70) return '#3b82f6'; // Blue - Good
  if (score >= 50) return '#f59e0b'; // Orange - Fair
  return '#ef4444'; // Red - Low
};

// Solar score gradient class mapping
export const getSolarScoreGradient = (score: number): string => {
  if (score >= 85) return 'from-emerald-500 to-green-600';
  if (score >= 70) return 'from-blue-500 to-blue-600';
  if (score >= 50) return 'from-amber-500 to-orange-600';
  return 'from-red-500 to-red-600';
};

// Get assessment text color
export const getAssessmentTextColor = (assessment: string): string => {
  switch (assessment.toLowerCase()) {
    case 'excellent': return 'text-emerald-600';
    case 'good': return 'text-blue-600';
    case 'fair': return 'text-amber-600';
    case 'low': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Format coordinates for display
export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
};

// Major Philippines cities for quick access
export const PHILIPPINES_CITIES = [
  { name: 'Manila', lat: 14.5995, lng: 120.9842 },
  { name: 'Quezon City', lat: 14.6760, lng: 121.0437 },
  { name: 'Davao', lat: 7.1907, lng: 125.4553 },
  { name: 'Cebu City', lat: 10.3157, lng: 123.8854 },
  { name: 'Zamboanga', lat: 6.9214, lng: 122.0790 },
  { name: 'Cagayan de Oro', lat: 8.4542, lng: 124.6319 },
  { name: 'Iloilo City', lat: 10.7202, lng: 122.5621 },
  { name: 'Bacolod', lat: 10.6770, lng: 122.9500 },
  { name: 'Baguio', lat: 16.4023, lng: 120.5960 },
  { name: 'Puerto Princesa', lat: 9.7392, lng: 118.7353 },
];

// Get nearest city name
export const getNearestCity = (lat: number, lng: number): string => {
  let nearestCity = 'Unknown Location';
  let minDistance = Infinity;

  PHILIPPINES_CITIES.forEach(city => {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  });

  return nearestCity;
};