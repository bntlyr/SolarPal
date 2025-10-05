'use client';

import { useEffect, useState } from 'react';
import { MapPin, Sun, Loader2 } from 'lucide-react';
import { PHILIPPINES_CONFIG, isWithinPhilippines } from '@/lib/map-utils';
import { Badge } from '@/components/ui/badge';
import { SolarData } from '@/lib/api';

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  solarData: SolarData | null;
  showSolarZones?: boolean;
  solarFilters?: {
    excellent: boolean;
    good: boolean;
    fair: boolean;
    low: boolean;
  };
  zoomLevel?: number;
  mapCenter?: { lat: number; lng: number };
}

// Loading component
const MapLoading = () => (
  <div className="h-full bg-muted rounded-lg flex items-center justify-center">
    <div className="text-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

// Map component that only runs on client side
const ClientOnlyMap = ({ 
  onLocationSelect, 
  selectedLocation, 
  solarData, 
  showSolarZones = false,
  solarFilters = { excellent: true, good: true, fair: false, low: false },
  zoomLevel,
  mapCenter
}: MapComponentProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapLibraries, setMapLibraries] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    setMapKey(Date.now()); // Generate unique key for map container
    
    // Load map libraries only on client
    const loadMapLibraries = async () => {
      try {
        console.log('🗺️ Loading map libraries...');
        const [leaflet, reactLeaflet] = await Promise.all([
          import('leaflet'),
          import('react-leaflet')
        ]);

        console.log('✅ Map libraries loaded successfully');

        // Fix default marker icons
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
          leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
        }

        setMapLibraries({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
          Popup: reactLeaflet.Popup,
          useMapEvents: reactLeaflet.useMapEvents,
          L: leaflet,
          Polygon: reactLeaflet.Polygon,
        });
      } catch (error) {
        console.error('❌ Failed to load map libraries:', error);
      }
    };

    loadMapLibraries();
  }, []);

  // Effect to update map center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && selectedLocation !== currentCenter) {
      setCurrentCenter(selectedLocation);
      // Regenerate map key to force re-render with new center and zoom
      setMapKey(Date.now());
    }
  }, [selectedLocation, currentCenter]);

  if (!isClient || !mapLibraries) {
    return <MapLoading />;
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents, L, Polygon } = mapLibraries;

  // Accurate Solar zones data based on Philippines solar irradiance patterns
  const solarZones = [
    // Excellent zones (85-100 score) - High solar irradiance areas
    {
      id: 'luzon-central-plains',
      type: 'excellent',
      score: 94,
      coordinates: [
        [15.8, 120.4], [15.8, 121.4], [14.8, 121.4], [14.8, 120.4]
      ],
      name: 'Central Luzon Plains'
    },
    {
      id: 'mindanao-cotabato',
      type: 'excellent', 
      score: 92,
      coordinates: [
        [7.5, 124.0], [7.5, 125.5], [6.0, 125.5], [6.0, 124.0]
      ],
      name: 'Cotabato Valley'
    },
    {
      id: 'palawan-south',
      type: 'excellent',
      score: 90,
      coordinates: [
        [9.5, 117.5], [9.5, 119.0], [8.0, 119.0], [8.0, 117.5]
      ],
      name: 'Southern Palawan'
    },
    {
      id: 'luzon-ilocos-coast',
      type: 'excellent',
      score: 88,
      coordinates: [
        [18.0, 120.3], [18.0, 120.8], [16.5, 120.8], [16.5, 120.3]
      ],
      name: 'Ilocos Coastal Plain'
    },
    {
      id: 'visayas-negros',
      type: 'excellent',
      score: 87,
      coordinates: [
        [10.8, 122.8], [10.8, 123.4], [9.8, 123.4], [9.8, 122.8]
      ],
      name: 'Negros Island Central'
    },
    {
      id: 'mindanao-davao-gulf',
      type: 'excellent',
      score: 89,
      coordinates: [
        [7.5, 125.2], [7.5, 126.0], [6.5, 126.0], [6.5, 125.2]
      ],
      name: 'Davao Gulf Region'
    },

    // Good zones (65-84 score) - Moderate solar irradiance
    {
      id: 'luzon-cagayan-valley',
      type: 'good',
      score: 82,
      coordinates: [
        [17.8, 121.2], [17.8, 122.2], [16.8, 122.2], [16.8, 121.2]
      ],
      name: 'Cagayan Valley'
    },
    {
      id: 'visayas-cebu',
      type: 'good',
      score: 80,
      coordinates: [
        [11.0, 123.7], [11.0, 124.3], [9.8, 124.3], [9.8, 123.7]
      ],
      name: 'Cebu Province'
    },
    {
      id: 'luzon-bataan-zambales',
      type: 'good',
      score: 78,
      coordinates: [
        [15.2, 119.8], [15.2, 120.4], [14.2, 120.4], [14.2, 119.8]
      ],
      name: 'Bataan-Zambales Coast'
    },
    {
      id: 'mindanao-bukidnon',
      type: 'good',
      score: 76,
      coordinates: [
        [8.5, 124.5], [8.5, 125.2], [7.5, 125.2], [7.5, 124.5]
      ],
      name: 'Bukidnon Plateau'
    },
    {
      id: 'palawan-central',
      type: 'good',
      score: 75,
      coordinates: [
        [11.0, 118.5], [11.0, 119.5], [9.5, 119.5], [9.5, 118.5]
      ],
      name: 'Central Palawan'
    },
    {
      id: 'visayas-bohol',
      type: 'good',
      score: 74,
      coordinates: [
        [10.2, 123.7], [10.2, 124.6], [9.4, 124.6], [9.4, 123.7]
      ],
      name: 'Bohol Island'
    },
    {
      id: 'luzon-pangasinan',
      type: 'good',
      score: 73,
      coordinates: [
        [16.2, 119.8], [16.2, 120.6], [15.5, 120.6], [15.5, 119.8]
      ],
      name: 'Pangasinan Plains'
    },
    {
      id: 'mindanao-lanao',
      type: 'good',
      score: 72,
      coordinates: [
        [8.2, 123.8], [8.2, 124.5], [7.5, 124.5], [7.5, 123.8]
      ],
      name: 'Lanao Provinces'
    },

    // Fair zones (45-64 score) - Lower solar irradiance
    {
      id: 'luzon-metro-manila',
      type: 'fair',
      score: 62,
      coordinates: [
        [14.8, 120.8], [14.8, 121.2], [14.3, 121.2], [14.3, 120.8]
      ],
      name: 'Metro Manila'
    },
    {
      id: 'luzon-southern-tagalog',
      type: 'fair',
      score: 60,
      coordinates: [
        [14.3, 121.0], [14.3, 122.0], [13.5, 122.0], [13.5, 121.0]
      ],
      name: 'Southern Tagalog'
    },
    {
      id: 'visayas-leyte-samar',
      type: 'fair',
      score: 58,
      coordinates: [
        [11.8, 124.5], [11.8, 125.7], [10.8, 125.7], [10.8, 124.5]
      ],
      name: 'Leyte-Samar'
    },
    {
      id: 'mindanao-caraga',
      type: 'fair',
      score: 56,
      coordinates: [
        [9.8, 125.2], [9.8, 126.5], [8.5, 126.5], [8.5, 125.2]
      ],
      name: 'Caraga Region'
    },
    {
      id: 'luzon-bicol',
      type: 'fair',
      score: 54,
      coordinates: [
        [13.8, 123.0], [13.8, 124.5], [12.5, 124.5], [12.5, 123.0]
      ],
      name: 'Bicol Peninsula'
    },
    {
      id: 'palawan-northern',
      type: 'fair',
      score: 52,
      coordinates: [
        [12.0, 118.8], [12.0, 119.8], [11.0, 119.8], [11.0, 118.8]
      ],
      name: 'Northern Palawan'
    },

    // Low zones (0-44 score) - Challenging areas with frequent cloud cover
    {
      id: 'mindanao-zamboanga',
      type: 'low',
      score: 42,
      coordinates: [
        [7.5, 122.0], [7.5, 123.5], [6.0, 123.5], [6.0, 122.0]
      ],
      name: 'Zamboanga Peninsula'
    },
    {
      id: 'luzon-cordillera',
      type: 'low',
      score: 38,
      coordinates: [
        [17.5, 120.5], [17.5, 121.3], [16.0, 121.3], [16.0, 120.5]
      ],
      name: 'Cordillera Mountains'
    },
    {
      id: 'mindanao-sulu',
      type: 'low',
      score: 35,
      coordinates: [
        [6.5, 120.5], [6.5, 122.0], [5.0, 122.0], [5.0, 120.5]
      ],
      name: 'Sulu Archipelago'
    },
    {
      id: 'visayas-panay-mountains',
      type: 'low',
      score: 33,
      coordinates: [
        [11.5, 122.0], [11.5, 122.8], [10.8, 122.8], [10.8, 122.0]
      ],
      name: 'Panay Mountains'
    },
    {
      id: 'luzon-aurora-pacific',
      type: 'low',
      score: 30,
      coordinates: [
        [16.0, 121.8], [16.0, 122.5], [15.0, 122.5], [15.0, 121.8]
      ],
      name: 'Aurora Pacific Coast'
    },

    // Additional zones for complete coverage
    {
      id: 'luzon-batanes',
      type: 'good',
      score: 71,
      coordinates: [
        [20.8, 121.5], [20.8, 122.0], [20.0, 122.0], [20.0, 121.5]
      ],
      name: 'Batanes Islands'
    },
    {
      id: 'luzon-northern-cagayan',
      type: 'fair',
      score: 59,
      coordinates: [
        [18.8, 121.2], [18.8, 122.2], [17.8, 122.2], [17.8, 121.2]
      ],
      name: 'Northern Cagayan'
    },
    {
      id: 'luzon-isabela',
      type: 'good',
      score: 77,
      coordinates: [
        [17.5, 121.3], [17.5, 122.0], [16.5, 122.0], [16.5, 121.3]
      ],
      name: 'Isabela Province'
    },
    {
      id: 'luzon-nueva-vizcaya',
      type: 'fair',
      score: 55,
      coordinates: [
        [16.8, 121.0], [16.8, 121.5], [16.0, 121.5], [16.0, 121.0]
      ],
      name: 'Nueva Vizcaya'
    },
    {
      id: 'luzon-quirino',
      type: 'fair',
      score: 53,
      coordinates: [
        [16.5, 121.5], [16.5, 122.0], [16.0, 122.0], [16.0, 121.5]
      ],
      name: 'Quirino Province'
    },
    {
      id: 'luzon-southern-quezon',
      type: 'fair',
      score: 57,
      coordinates: [
        [14.2, 121.5], [14.2, 122.5], [13.5, 122.5], [13.5, 121.5]
      ],
      name: 'Southern Quezon'
    },
    {
      id: 'luzon-marinduque',
      type: 'good',
      score: 68,
      coordinates: [
        [13.6, 121.8], [13.6, 122.1], [13.2, 122.1], [13.2, 121.8]
      ],
      name: 'Marinduque Island'
    },
    {
      id: 'luzon-mindoro',
      type: 'good',
      score: 72,
      coordinates: [
        [13.5, 120.8], [13.5, 121.5], [12.5, 121.5], [12.5, 120.8]
      ],
      name: 'Mindoro Island'
    },
    {
      id: 'luzon-romblon',
      type: 'good',
      score: 69,
      coordinates: [
        [12.8, 122.0], [12.8, 122.5], [12.2, 122.5], [12.2, 122.0]
      ],
      name: 'Romblon Province'
    },
    {
      id: 'visayas-masbate',
      type: 'good',
      score: 73,
      coordinates: [
        [12.8, 123.2], [12.8, 124.0], [12.0, 124.0], [12.0, 123.2]
      ],
      name: 'Masbate Island'
    },
    {
      id: 'visayas-western-panay',
      type: 'good',
      score: 74,
      coordinates: [
        [11.8, 122.0], [11.8, 122.8], [10.8, 122.8], [10.8, 122.0]
      ],
      name: 'Western Panay'
    },
    {
      id: 'visayas-aklan-capiz',
      type: 'good',
      score: 70,
      coordinates: [
        [11.8, 122.0], [11.8, 122.5], [11.2, 122.5], [11.2, 122.0]
      ],
      name: 'Aklan-Capiz'
    },
    {
      id: 'visayas-northern-samar',
      type: 'fair',
      score: 50,
      coordinates: [
        [12.8, 124.5], [12.8, 125.2], [12.2, 125.2], [12.2, 124.5]
      ],
      name: 'Northern Samar'
    },
    {
      id: 'visayas-eastern-samar',
      type: 'low',
      score: 35,
      coordinates: [
        [11.8, 125.2], [11.8, 125.8], [11.0, 125.8], [11.0, 125.2]
      ],
      name: 'Eastern Samar'
    },
    {
      id: 'visayas-southern-leyte',
      type: 'fair',
      score: 55,
      coordinates: [
        [10.8, 124.8], [10.8, 125.5], [10.0, 125.5], [10.0, 124.8]
      ],
      name: 'Southern Leyte'
    },
    {
      id: 'mindanao-misamis-occidental',
      type: 'good',
      score: 68,
      coordinates: [
        [8.8, 123.5], [8.8, 124.2], [8.0, 124.2], [8.0, 123.5]
      ],
      name: 'Misamis Occidental'
    },
    {
      id: 'mindanao-misamis-oriental',
      type: 'fair',
      score: 61,
      coordinates: [
        [9.0, 124.2], [9.0, 125.0], [8.3, 125.0], [8.3, 124.2]
      ],
      name: 'Misamis Oriental'
    },
    {
      id: 'mindanao-agusan-norte',
      type: 'fair',
      score: 58,
      coordinates: [
        [9.2, 125.5], [9.2, 126.0], [8.5, 126.0], [8.5, 125.5]
      ],
      name: 'Agusan del Norte'
    },
    {
      id: 'mindanao-agusan-sur',
      type: 'fair',
      score: 56,
      coordinates: [
        [8.5, 125.5], [8.5, 126.2], [7.8, 126.2], [7.8, 125.5]
      ],
      name: 'Agusan del Sur'
    },
    {
      id: 'mindanao-surigao-norte',
      type: 'fair',
      score: 54,
      coordinates: [
        [10.0, 125.2], [10.0, 126.0], [9.2, 126.0], [9.2, 125.2]
      ],
      name: 'Surigao del Norte'
    },
    {
      id: 'mindanao-surigao-sur',
      type: 'fair',
      score: 52,
      coordinates: [
        [9.2, 125.8], [9.2, 126.5], [8.5, 126.5], [8.5, 125.8]
      ],
      name: 'Surigao del Sur'
    },
    {
      id: 'mindanao-camiguin',
      type: 'fair',
      score: 59,
      coordinates: [
        [9.3, 124.6], [9.3, 124.8], [9.1, 124.8], [9.1, 124.6]
      ],
      name: 'Camiguin Island'
    },
    {
      id: 'mindanao-bohol-sea',
      type: 'good',
      score: 71,
      coordinates: [
        [9.5, 123.8], [9.5, 124.5], [8.8, 124.5], [8.8, 123.8]
      ],
      name: 'Bohol Sea Region'
    },
    {
      id: 'mindanao-south-cotabato',
      type: 'excellent',
      score: 88,
      coordinates: [
        [6.5, 124.5], [6.5, 125.5], [5.8, 125.5], [5.8, 124.5]
      ],
      name: 'South Cotabato'
    },
    {
      id: 'mindanao-general-santos',
      type: 'excellent',
      score: 91,
      coordinates: [
        [6.5, 125.0], [6.5, 125.5], [6.0, 125.5], [6.0, 125.0]
      ],
      name: 'General Santos Area'
    },
    {
      id: 'mindanao-sarangani',
      type: 'excellent',
      score: 89,
      coordinates: [
        [6.0, 125.2], [6.0, 125.8], [5.4, 125.8], [5.4, 125.2]
      ],
      name: 'Sarangani Province'
    },
    {
      id: 'mindanao-sultan-kudarat',
      type: 'good',
      score: 75,
      coordinates: [
        [7.0, 124.0], [7.0, 124.8], [6.2, 124.8], [6.2, 124.0]
      ],
      name: 'Sultan Kudarat'
    },
    {
      id: 'mindanao-maguindanao',
      type: 'good',
      score: 73,
      coordinates: [
        [7.2, 124.0], [7.2, 124.8], [6.8, 124.8], [6.8, 124.0]
      ],
      name: 'Maguindanao'
    },
    {
      id: 'sulu-tawi-tawi',
      type: 'low',
      score: 28,
      coordinates: [
        [5.2, 119.8], [5.2, 120.5], [4.8, 120.5], [4.8, 119.8]
      ],
      name: 'Tawi-Tawi'
    },
    {
      id: 'sulu-basilan',
      type: 'low',
      score: 32,
      coordinates: [
        [6.8, 122.0], [6.8, 122.3], [6.4, 122.3], [6.4, 122.0]
      ],
      name: 'Basilan Island'
    },

    // Additional coverage zones to fill gaps
    {
      id: 'luzon-eastern-coast',
      type: 'fair',
      score: 51,
      coordinates: [
        [15.5, 121.8], [15.5, 122.2], [14.5, 122.2], [14.5, 121.8]
      ],
      name: 'Eastern Luzon Coast'
    },
    {
      id: 'luzon-central-mountain',
      type: 'low',
      score: 36,
      coordinates: [
        [16.5, 120.8], [16.5, 121.2], [15.8, 121.2], [15.8, 120.8]
      ],
      name: 'Central Luzon Mountains'
    },
    {
      id: 'visayas-central-seas',
      type: 'good',
      score: 67,
      coordinates: [
        [11.0, 123.0], [11.0, 124.0], [10.0, 124.0], [10.0, 123.0]
      ],
      name: 'Central Visayas Seas'
    },
    {
      id: 'mindanao-western-coast',
      type: 'fair',
      score: 49,
      coordinates: [
        [8.5, 123.0], [8.5, 123.8], [7.0, 123.8], [7.0, 123.0]
      ],
      name: 'Western Mindanao Coast'
    },
    {
      id: 'mindanao-northeastern',
      type: 'fair',
      score: 48,
      coordinates: [
        [9.8, 125.8], [9.8, 126.5], [9.0, 126.5], [9.0, 125.8]
      ],
      name: 'Northeastern Mindanao'
    },
    {
      id: 'palawan-extreme-south',
      type: 'good',
      score: 78,
      coordinates: [
        [8.0, 117.0], [8.0, 118.0], [7.0, 118.0], [7.0, 117.0]
      ],
      name: 'Southern Palawan Tip'
    }
  ];

  const getZoneColor = (type: string) => {
    switch (type) {
      case 'excellent': return '#22c55e'; // green
      case 'good': return '#eab308'; // yellow
      case 'fair': return '#f97316'; // orange
      case 'low': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  // Filter zones based on settings
  const filteredZones = solarZones.filter(zone => {
    return solarFilters[zone.type as keyof typeof solarFilters];
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createSolarZonePolygon = (zone: any) => {
    if (!showSolarZones || !solarFilters[zone.type as keyof typeof solarFilters]) {
      return null;
    }

    return (
      <Polygon
        key={zone.id}
        positions={zone.coordinates}
        pathOptions={{
          color: getZoneColor(zone.type),
          fillColor: getZoneColor(zone.type),
          fillOpacity: 0.3,
          weight: 2,
          opacity: 0.8
        }}
      >
        <Popup>
          <div className="p-2">
            <h4 className="font-medium">{zone.name}</h4>
            <p className="text-sm text-muted-foreground">
              Solar Score: {zone.score}/100
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {zone.type} potential zone
            </p>
          </div>
        </Popup>
      </Polygon>
    );
  };

  // Custom solar marker icon
  const createSolarIcon = (color = '#f59e0b') => {
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-solar-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        console.log('🗺️ Map clicked:', { lat, lng });
        
        if (isWithinPhilippines(lat, lng)) {
          console.log('✅ Coordinates are within Philippines bounds');
          onLocationSelect(lat, lng);
        } else {
          console.warn('❌ Coordinates are outside Philippines bounds');
          alert('Please select a location within the Philippines!');
        }
      },
    });
    return null;
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        key={mapKey}
        center={[
          mapCenter?.lat || selectedLocation?.lat || PHILIPPINES_CONFIG.center.lat,
          mapCenter?.lng || selectedLocation?.lng || PHILIPPINES_CONFIG.center.lng
        ]}
        zoom={zoomLevel || (selectedLocation ? 12 : PHILIPPINES_CONFIG.zoom)}
        className="h-full w-full"
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        <MapClickHandler />
        
        {/* Solar Zones */}
        {showSolarZones && filteredZones.map((zone) => createSolarZonePolygon(zone))}
        
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createSolarIcon('#f59e0b')}
          >
            <Popup>
              <div className="p-2 space-y-2 min-w-[220px]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">Precise Analysis Point</span>
                </div>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  Lat: {selectedLocation.lat.toFixed(6)}°N<br/>
                  Lng: {selectedLocation.lng.toFixed(6)}°E
                </div>
                <div className="text-xs text-muted-foreground">
                  Click anywhere to analyze solar potential at exact coordinates
                </div>
                
                {solarData && (
                  <div className="mt-3 pt-2 border-t space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Solar Analysis</span>
                    </div>
                    <div className="grid gap-1 text-xs">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <Badge variant="secondary">{solarData.solar_score}/100</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-medium">{solarData.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Irradiance:</span>
                        <span>{solarData.avg_irradiance?.toFixed(2)} kWh/m²/day</span>
                      </div>
                      {solarData.estimated_annual_kwh_per_kw && (
                        <div className="flex justify-between">
                          <span>Est. Annual:</span>
                          <span>{solarData.estimated_annual_kwh_per_kw.toLocaleString()} kWh/kW</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

// Main MapComponent with SSR safety
const MapComponent = (props: MapComponentProps) => {
  return <ClientOnlyMap {...props} />;
};

export default MapComponent;