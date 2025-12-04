// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for AI processing
});

// Request interceptor for adding loading states or tokens
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection and if the backend is running.'));
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const optimizeService = {
  // Optimize a product by ASIN
  optimizeProduct: async (asin) => {
    try {
      const response = await api.post('/optimize', { asin });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Failed to optimize product. Please try again.' 
      };
    }
  },
  
  // Get optimization history for a specific ASIN
  getHistoryByASIN: async (asin) => {
    try {
      const response = await api.get(`/history/${asin}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Failed to fetch history.' 
      };
    }
  },
  
  // Get all optimization history
  getAllHistory: async () => {
    try {
      const response = await api.get('/history');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Failed to fetch history.' 
      };
    }
  },
  
  // Check API health
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Backend is not responding.' 
      };
    }
  }
};

// Export the axios instance for custom calls
export default api;