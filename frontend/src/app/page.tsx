'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sun, MapPin, Loader2, Zap, Info, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { apiService, type SolarData } from '@/lib/api';
import { getSolarScoreGradient, getAssessmentTextColor, formatCoordinates } from '@/lib/map-utils';

// Dynamic import for map component (client-side only)
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
});

interface AppState {
  selectedLocation: { lat: number; lng: number } | null;
  solarData: SolarData | null;
  loading: boolean;
  error: string | null;
  isBackendConnected: boolean;
  showSolarZones: boolean;
  solarFilters: {
    excellent: boolean;
    good: boolean;
    fair: boolean;
    low: boolean;
  };
  searchQuery: string;
  isMobilePanelOpen: boolean;
  searching: boolean;
  keepAliveStatus: {
    isActive: boolean;
    lastPing: Date | null;
    pingCount: number;
  };
}

export default function HomePage() {
  const [state, setState] = useState<AppState>({
    selectedLocation: null,
    solarData: null,
    loading: false,
    error: null,
    isBackendConnected: false,
    showSolarZones: false,
    solarFilters: {
      excellent: true,
      good: true,
      fair: false,
      low: false,
    },
    searchQuery: '',
    isMobilePanelOpen: false,
    searching: false,
    keepAliveStatus: {
      isActive: false,
      lastPing: null,
      pingCount: 0,
    },
  });

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await apiService.healthCheck();
        setState(prev => ({ ...prev, isBackendConnected: true }));
      } catch {
        setState(prev => ({ 
          ...prev, 
          isBackendConnected: false,
          error: 'Backend service is unavailable'
        }));
      }
    };
    
    checkBackend();
  }, []);

  // Keep-alive functionality
  useEffect(() => {
    let keepAliveInterval: NodeJS.Timeout;

    const pingBackend = async () => {
      try {
        await apiService.keepAlive();
        setState(prev => ({
          ...prev,
          keepAliveStatus: {
            isActive: true,
            lastPing: new Date(),
            pingCount: prev.keepAliveStatus.pingCount + 1,
          }
        }));
        console.log(`✅ Keep-alive ping successful at ${new Date().toLocaleString()}`);
      } catch (error) {
        console.log(`❌ Keep-alive ping failed:`, error);
        setState(prev => ({
          ...prev,
          keepAliveStatus: {
            ...prev.keepAliveStatus,
            isActive: false,
          }
        }));
      }
    };

    // Only start keep-alive in production (when API URL is not localhost)
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    if (!apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
      console.log('🔄 Starting keep-alive monitor for production backend...');
      
      // Initial ping after 30 seconds
      setTimeout(pingBackend, 30000);
      
      // Then ping every 10 minutes
      keepAliveInterval = setInterval(pingBackend, 10 * 60 * 1000);
      
      setState(prev => ({
        ...prev,
        keepAliveStatus: {
          ...prev.keepAliveStatus,
          isActive: true,
        }
      }));
    } else {
      console.log('🏠 Development mode - keep-alive disabled');
    }

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setState(prev => ({ 
      ...prev, 
      selectedLocation: { lat, lng }, 
      loading: true, 
      error: null,
      isMobilePanelOpen: true  // Open panel on mobile when location is selected
    }));

    try {
      const data = await apiService.getSolarData(lat, lng);
      setState(prev => ({ 
        ...prev, 
        solarData: data, 
        loading: false 
      }));
      toast.success(`☀️ Solar analysis complete! Score: ${data.solar_score}/100`);
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to fetch solar data';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }));
      toast.error(errorMessage);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return false;
    
    setState(prev => ({ ...prev, searching: true }));
    
    // First try preset Philippines cities
    const locations = {
      'manila': { lat: 14.5995, lng: 120.9842, name: 'Manila' },
      'cebu': { lat: 10.3157, lng: 123.8854, name: 'Cebu City' },
      'davao': { lat: 7.1907, lng: 125.4553, name: 'Davao City' },
      'baguio': { lat: 16.4023, lng: 120.5960, name: 'Baguio City' },
      'iloilo': { lat: 10.7202, lng: 122.5621, name: 'Iloilo City' },
      'zamboanga': { lat: 6.9214, lng: 122.0790, name: 'Zamboanga City' },
      'cagayan de oro': { lat: 8.4542, lng: 124.6319, name: 'Cagayan de Oro' },
      'bacolod': { lat: 10.6770, lng: 122.9500, name: 'Bacolod City' },
      'makati': { lat: 14.5547, lng: 121.0244, name: 'Makati City' },
      'quezon city': { lat: 14.6760, lng: 121.0437, name: 'Quezon City' },
      'taguig': { lat: 14.5176, lng: 121.0509, name: 'Taguig City' },
      'pasig': { lat: 14.5764, lng: 121.0851, name: 'Pasig City' },
      'antipolo': { lat: 14.5932, lng: 121.1815, name: 'Antipolo City' },
      'caloocan': { lat: 14.6479, lng: 120.9634, name: 'Caloocan City' },
      'las pinas': { lat: 14.4378, lng: 120.9761, name: 'Las Pinas City' },
      'marikina': { lat: 14.6507, lng: 121.1029, name: 'Marikina City' },
      'muntinlupa': { lat: 14.4037, lng: 121.0365, name: 'Muntinlupa City' },
      'paranaque': { lat: 14.4793, lng: 121.0198, name: 'Paranaque City' },
      'pasay': { lat: 14.5352, lng: 120.9896, name: 'Pasay City' },
      'san juan': { lat: 14.6019, lng: 121.0355, name: 'San Juan City' },
      'valenzuela': { lat: 14.7000, lng: 120.9822, name: 'Valenzuela City' },
      'malabon': { lat: 14.6576, lng: 120.9645, name: 'Malabon City' },
      'navotas': { lat: 14.6691, lng: 120.9467, name: 'Navotas City' },
      'angeles': { lat: 15.1450, lng: 120.5930, name: 'Angeles City' },
      'olongapo': { lat: 14.8294, lng: 120.2834, name: 'Olongapo City' },
      'san fernando': { lat: 15.0588, lng: 120.6897, name: 'San Fernando City' },
      'tarlac': { lat: 15.4754, lng: 120.5964, name: 'Tarlac City' },
      'dagupan': { lat: 16.0433, lng: 120.3433, name: 'Dagupan City' },
      'laoag': { lat: 18.1967, lng: 120.5931, name: 'Laoag City' },
      'vigan': { lat: 17.5748, lng: 120.3871, name: 'Vigan City' },
      'tuguegarao': { lat: 17.6132, lng: 121.7270, name: 'Tuguegarao City' },
      'legazpi': { lat: 13.1391, lng: 123.7437, name: 'Legazpi City' },
      'naga': { lat: 13.6218, lng: 123.1948, name: 'Naga City' },
      'puerto princesa': { lat: 9.7392, lng: 118.7353, name: 'Puerto Princesa City' },
      'tagbilaran': { lat: 9.6496, lng: 123.8628, name: 'Tagbilaran City' },
      'dumaguete': { lat: 9.3063, lng: 123.3018, name: 'Dumaguete City' },
      'tacloban': { lat: 11.2447, lng: 125.0047, name: 'Tacloban City' },
      'ormoc': { lat: 11.0059, lng: 124.6074, name: 'Ormoc City' },
      'roxas': { lat: 11.5875, lng: 122.7508, name: 'Roxas City' },
      'kalibo': { lat: 11.7043, lng: 122.3679, name: 'Kalibo' },
      'boracay': { lat: 11.9674, lng: 121.9248, name: 'Boracay' },
      'butuan': { lat: 8.9470, lng: 125.5406, name: 'Butuan City' },
      'surigao': { lat: 9.7875, lng: 125.4919, name: 'Surigao City' },
      'dipolog': { lat: 8.5958, lng: 123.3418, name: 'Dipolog City' },
      'ozamiz': { lat: 8.1478, lng: 123.8429, name: 'Ozamiz City' },
      'pagadian': { lat: 7.8306, lng: 123.4367, name: 'Pagadian City' },
      'cotabato': { lat: 7.2231, lng: 124.2467, name: 'Cotabato City' },
      'general santos': { lat: 6.1164, lng: 125.1716, name: 'General Santos City' },
      'koronadal': { lat: 6.5008, lng: 124.8467, name: 'Koronadal City' },
      'kidapawan': { lat: 7.0103, lng: 125.0893, name: 'Kidapawan City' },
      'marbel': { lat: 6.5008, lng: 124.8467, name: 'Koronadal City' },
      'jolo': { lat: 6.0572, lng: 121.0031, name: 'Jolo' },
    };

    const searchKey = query.toLowerCase().trim();
    const location = locations[searchKey as keyof typeof locations];
    
    if (location) {
      // Automatically trigger solar analysis for found location
      toast.success(`🔍 Found ${location.name} - Zooming in and analyzing solar potential...`);
      await handleLocationSelect(location.lat, location.lng);
      setState(prev => ({ 
        ...prev, 
        searchQuery: query,
        searching: false
      }));
      return true;
    }
    
    // Try to parse coordinates (lat,lng format)
    const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= 5 && lat <= 21 && lng >= 117 && lng <= 127) {
        // Automatically trigger solar analysis for coordinates
        toast.success(`📍 Coordinates found - Zooming in and analyzing solar potential...`);
        await handleLocationSelect(lat, lng);
        setState(prev => ({ 
          ...prev, 
          searchQuery: query,
          searching: false
        }));
        return true;
      }
    }
    
    // Try global geocoding using Nominatim (OpenStreetMap)
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Philippines')}&limit=1&countrycodes=ph`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Verify it's within Philippines bounds
        if (lat >= 5 && lat <= 21 && lng >= 117 && lng <= 127) {
          // Automatically trigger solar analysis for geocoded location
          const locationName = result.display_name.split(',')[0];
          toast.success(`🌍 Found: ${locationName} - Zooming in and analyzing solar potential...`);
          await handleLocationSelect(lat, lng);
          setState(prev => ({ 
            ...prev, 
            searchQuery: query,
            searching: false
          }));
          return true;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    setState(prev => ({ ...prev, searching: false }));
    toast.error('Location not found in Philippines. Try a city name or coordinates (lat,lng)');
    return false;
  };

  const toggleSolarZones = () => {
    setState(prev => ({ 
      ...prev, 
      showSolarZones: !prev.showSolarZones 
    }));
  };

  const updateSolarFilter = (filter: keyof typeof state.solarFilters, checked: boolean) => {
    setState(prev => ({
      ...prev,
      solarFilters: {
        ...prev.solarFilters,
        [filter]: checked
      }
    }));
  };

  const handleManilaDemo = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await apiService.getManilaDemo();
      setState(prev => ({ 
        ...prev, 
        selectedLocation: { lat: 14.5995, lng: 120.9842 },
        solarData: data, 
        loading: false 
      }));
      toast.success('Manila demo data loaded!');
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to load Manila demo';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
    }
  };

  const renderHeader = () => (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container w-full flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sun className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl">SolarPal</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Philippines
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {!state.isBackendConnected && (
            <Alert className="hidden md:flex w-auto py-1 px-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Backend disconnected
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </header>
  );

  const renderSolarDataCard = () => {
    if (!state.solarData) return null;

    const { 
      solar_score, 
      rating, 
      avg_irradiance, 
      location, 
      coordinates, 
      recommendation,
      consistency_score,
      min_irradiance,
      max_irradiance,
      estimated_annual_kwh_per_kw,
      analysis_note
    } = state.solarData;
    const scoreGradient = getSolarScoreGradient(solar_score);
    const assessmentColor = getAssessmentTextColor(rating);

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Solar Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Score Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {solar_score}/100
              </div>
              <div className={`text-sm font-medium ${assessmentColor}`}>
                {rating} potential
              </div>
            </div>
            <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${scoreGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
              {solar_score}
            </div>
          </div>

          {/* Recommendation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {recommendation}
            </AlertDescription>
          </Alert>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-amber-600">{avg_irradiance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Avg Irradiance (kWh/m²/day)</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-green-600">{consistency_score ?? 'N/A'}%</div>
              <div className="text-xs text-muted-foreground">Consistency Score</div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Detailed Analysis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Min Irradiance</div>
                <div className="font-medium">{min_irradiance ?? 'N/A'} kWh/m²/day</div>
              </div>
              <div>
                <div className="text-muted-foreground">Max Irradiance</div>
                <div className="font-medium">{max_irradiance ?? 'N/A'} kWh/m²/day</div>
              </div>
              <div>
                <div className="text-muted-foreground">Est. Annual Production</div>
                <div className="font-medium">{estimated_annual_kwh_per_kw?.toLocaleString() ?? 'N/A'} kWh/kW</div>
              </div>
              <div>
                <div className="text-muted-foreground">Location</div>
                <div className="font-medium">{location}</div>
              </div>
            </div>
          </div>

          {/* Precise Coordinates */}
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground mb-2">Precise Analysis Point</div>
            <div className="text-sm font-mono bg-muted p-2 rounded">
              {formatCoordinates(coordinates.latitude, coordinates.longitude)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analysis_note ?? ''}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingCard = () => (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {renderHeader()}
      
      <main className="flex-1 flex flex-col lg:flex-row relative">
        {/* Map Section - Full Screen on Mobile */}
        <div className="flex-1 order-2 lg:order-1 h-full lg:h-auto p-2 lg:p-4">
          <div className="h-full rounded-lg overflow-hidden border">
            <MapComponent
              onLocationSelect={handleLocationSelect}
              selectedLocation={state.selectedLocation}
              solarData={state.solarData}
              showSolarZones={state.showSolarZones}
              solarFilters={state.solarFilters}
              zoomLevel={state.selectedLocation ? 12 : undefined}
              mapCenter={state.selectedLocation ? state.selectedLocation : undefined}
            />
          </div>
        </div>

        {/* Mobile Bottom Panel (Google Maps Style) */}
        <div className="lg:hidden order-3 absolute bottom-0 left-0 right-0 z-40">
          {/* Search Bar */}
          <div className="p-4 bg-background border-t">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search any place in Philippines..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(state.searchQuery)}
                  className="w-full pl-10 pr-3 py-3 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={state.searching}
                />
                {state.searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSearch(state.searchQuery)}
                disabled={!state.searchQuery || state.searching}
              >
                Go
              </Button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-background border-t p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">Solar Analysis Controls</h3>
              <Button
                variant={state.showSolarZones ? "default" : "outline"}
                size="sm"
                onClick={toggleSolarZones}
              >
                <Filter className="h-4 w-4 mr-2" />
                {state.showSolarZones ? 'Hide Zones' : 'Show Zones'}
              </Button>
            </div>
            
            {state.showSolarZones && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { key: 'excellent', label: 'Excellent', color: 'bg-green-500' },
                  { key: 'good', label: 'Good', color: 'bg-yellow-500' },
                  { key: 'fair', label: 'Fair', color: 'bg-orange-500' },
                  { key: 'low', label: 'Low', color: 'bg-red-500' }
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={state.solarFilters[key as keyof typeof state.solarFilters]}
                      onChange={(e) => updateSolarFilter(key as keyof typeof state.solarFilters, e.target.checked)}
                      className="rounded"
                    />
                    <div className={`w-3 h-3 rounded ${color}`} />
                    <label htmlFor={key} className="text-xs">{label}</label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Panel - Slide up when data available */}
          {(state.solarData || state.loading) && (
            <div className="bg-background border-t max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Analysis Results</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, solarData: null, selectedLocation: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {state.loading ? renderLoadingCard() : renderSolarDataCard()}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 order-2 border-l bg-muted/50 overflow-y-auto flex-col">
          <div className="p-4 space-y-4">
            {/* Search Section */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Location Search</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search any place in Philippines..."
                    value={state.searchQuery}
                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(state.searchQuery)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={state.searching}
                  />
                  {state.searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(state.searchQuery)}
                  disabled={!state.searchQuery || state.searching}
                >
                  Go
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {['Manila', 'Cebu', 'Davao', 'Baguio'].map((city) => (
                  <Button
                    key={city}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSearch(city)}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Solar Zones Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Solar Potential Zones</h3>
                <Button
                  variant={state.showSolarZones ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSolarZones}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {state.showSolarZones ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {state.showSolarZones && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Filter zones by solar potential:</p>
                  <div className="space-y-2">
                    {[
                      { key: 'excellent', label: 'Excellent (85-100)', color: 'bg-green-500' },
                      { key: 'good', label: 'Good (65-84)', color: 'bg-yellow-500' },
                      { key: 'fair', label: 'Fair (45-64)', color: 'bg-orange-500' },
                      { key: 'low', label: 'Low (0-44)', color: 'bg-red-500' }
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`desktop-${key}`}
                          checked={state.solarFilters[key as keyof typeof state.solarFilters]}
                          onChange={(e) => updateSolarFilter(key as keyof typeof state.solarFilters, e.target.checked)}
                          className="rounded"
                        />
                        <div className={`w-3 h-3 rounded ${color}`} />
                        <label htmlFor={`desktop-${key}`} className="text-sm">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t my-4" />

            {/* Analysis Instructions */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Click anywhere on the map to analyze solar potential for that exact location. Search works globally within Philippines.
              </p>
            </div>

            {/* Manila Demo Button */}
            <Button 
              onClick={handleManilaDemo}
              disabled={state.loading || !state.isBackendConnected}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Try Manila Demo
            </Button>

            {/* Backend Status */}
            {!state.isBackendConnected && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Backend service is not available. Please ensure the FastAPI server is running.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Content */}
            {state.loading ? renderLoadingCard() : renderSolarDataCard()}

            {/* Instructions */}
            {!state.solarData && !state.loading && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Sun className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Precise Solar Analysis</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click anywhere on the map to get detailed solar potential analysis for the exact coordinates where you plan to install solar panels.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}