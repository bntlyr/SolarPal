import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  env: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// TypeScript interfaces
export interface SolarData {
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  avg_irradiance: number;
  solar_score: number;
  rating: string;
  recommendation: string;
  consistency_score?: number;
  min_irradiance?: number;
  max_irradiance?: number;
  estimated_annual_kwh_per_kw?: number;
  data_points?: number;
  period?: string;
  analysis_note?: string;
}

export interface SolarZone {
  id: string;
  name: string;
  region: string;
  type: 'excellent' | 'good' | 'fair' | 'low';
  color: string;
  score: number;
  coordinates: [number, number][];
  center: [number, number];
  avg_irradiance: number;
  rating: string;
  recommendation: string;
  consistency_score: number;
  min_irradiance: number;
  max_irradiance: number;
  data_source: string;
  last_updated: string;
}

export interface SolarZonesResponse {
  zones: SolarZone[];
  statistics: {
    total_zones: number;
    avg_solar_score: number;
    avg_irradiance: number;
    max_score: number;
    min_score: number;
    last_updated: string;
    data_source: string;
  };
  metadata: {
    description: string;
    update_frequency: string;
    coverage: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      method: config.method,
      params: config.params,
      data: config.data,
      baseURL: config.baseURL,
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.baseURL}${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Response Error:', {
      url: `${error.config?.baseURL}${error.config?.url}`,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      params: error.config?.params,
      requestData: error.config?.data,
    });
    return Promise.reject(error);
  }
);

// API Functions
export const apiService = {
  // Health check with improved error handling
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      console.log('🔍 Checking backend health...');
      const response = await api.get('/', { timeout: 5000 });
      console.log('✅ Backend health check successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('❌ Backend health check failed:', {
        message: (error as Error).message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });
      
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to backend server. Please ensure it is running on port 8000.');
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Backend may be slow to respond.');
      } else {
        throw new Error('Backend service is not available');
      }
    }
  },

  // Keep-alive endpoint to prevent backend from sleeping
  async keepAlive(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      console.log('🔄 Sending keep-alive ping...');
      const response = await api.get('/keep-alive', { timeout: 30000 });
      console.log('✅ Keep-alive ping successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('❌ Keep-alive ping failed:', {
        message: (error as Error).message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });
      throw new Error('Keep-alive ping failed');
    }
  },

  // Get solar data for coordinates with enhanced error handling
  async getSolarData(latitude: number, longitude: number): Promise<SolarData> {
    try {
      // Validate input parameters
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Latitude and longitude must be numbers');
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Latitude and longitude must be valid numbers');
      }

      // Validate Philippines bounds
      const isInPhilippines = 
        latitude >= 4.5 && latitude <= 21.5 &&
        longitude >= 116.0 && longitude <= 127.0;

      if (!isInPhilippines) {
        throw new Error('Location must be within the Philippines (4.5°-21.5°N, 116°-127°E)');
      }

      console.log(`🗺️ Fetching solar data for coordinates:`, { 
        latitude: Number(latitude.toFixed(4)), 
        longitude: Number(longitude.toFixed(4)) 
      });

      const response = await api.get('/api/solar', {
        params: { 
          lat: Number(latitude.toFixed(4)), 
          lon: Number(longitude.toFixed(4))
        },
        timeout: 20000,
      });

      // Validate response data
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const data = response.data;
      
      // Validate required fields from backend response
      const requiredFields = ['location', 'coordinates', 'avg_irradiance', 'solar_score', 'rating'];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      console.log(`✅ Solar data received successfully:`, data);
      return data;
    } catch (error: unknown) {
      const apiError = error as AxiosError;
      console.error('❌ Failed to fetch solar data:', {
        error: (error as Error).message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        code: apiError.code,
        latitude,
        longitude,
      });
      
      // Enhanced error handling with specific error types
      if (apiError.response?.status === 400) {
        const responseData = apiError.response.data as { detail?: string };
        const detail = responseData?.detail || 'Invalid coordinates provided';
        throw new Error(`Bad Request: ${detail}`);
      } else if (apiError.response?.status === 422) {
        const responseData = apiError.response.data as { detail?: string | Array<{ loc?: string[]; msg: string }> };
        const detail = responseData?.detail || 'Invalid parameter format';
        const message = Array.isArray(detail) 
          ? detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
          : detail;
        throw new Error(`Validation Error: ${message}`);
      } else if (apiError.response?.status === 500) {
        throw new Error('Server error occurred while fetching solar data');
      } else if (apiError.response?.status === 404) {
        throw new Error('Solar data endpoint not found. Please check if the backend is running correctly.');
      } else if (apiError.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please try again');
      } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to backend server. Please ensure it is running on port 8000.');
      } else {
        throw new Error((error as Error).message || 'Failed to fetch solar data');
      }
    }
  },

  // Get solar zones data with enhanced error handling
  async getSolarZones(): Promise<SolarZonesResponse> {
    try {
      console.log('🌞 Fetching solar zones data...');
      const response = await api.get('/api/solar-zones', {
        timeout: 30000, // Longer timeout for zones data
      });

      if (!response.data) {
        throw new Error('No zones data received from server');
      }

      console.log('✅ Solar zones data received successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError;
      console.error('❌ Failed to fetch solar zones:', {
        error: (error as Error).message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        code: apiError.code,
      });

      if (apiError.response?.status === 404) {
        throw new Error('Solar zones endpoint not found. Please check if the backend is running correctly.');
      } else if (apiError.code === 'ECONNABORTED') {
        throw new Error('Request timeout while fetching zones - please try again');
      } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to backend server. Please ensure it is running on port 8000.');
      } else {
        throw new Error((error as Error).message || 'Failed to fetch solar zones');
      }
    }
  },

  // Get demo data for Manila with enhanced error handling
  async getManilaDemo(): Promise<SolarData> {
    console.log('🏙️ Loading Manila demo data...');
    try {
      return await this.getSolarData(14.5995, 120.9842);
    } catch (error) {
      console.error('❌ Manila demo failed:', error);
      throw new Error(`Manila demo failed: ${(error as Error).message}`);
    }
  }
};

export default api;