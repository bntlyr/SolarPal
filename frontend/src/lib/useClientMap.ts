'use client';

import { useEffect, useState } from 'react';

// Custom hook for client-side map utilities
export const useClientMap = () => {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setIsClient(true);
      
      // Dynamically import Leaflet
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      }).catch((error) => {
        console.error('Failed to load Leaflet:', error);
      });
    }
  }, []);

  return { isClient, L };
};

// Client-safe map bounds generator
export const usePhilippinesBounds = () => {
  const { isClient, L } = useClientMap();
  
  if (!isClient || !L) return null;
  
  // Philippines bounds
  const bounds = {
    north: 21.5,
    south: 4.5,
    east: 127.0,
    west: 116.0,
  };
  
  return new L.LatLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  );
};