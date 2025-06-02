// frontend/src/services/apiClient.js
import axios from 'axios';

// Determine the base URL for the API.
// In development, this will point to your FastAPI backend (usually port 8000).
// In production, this would be your deployed backend URL.

// Check if we're in a production environment (like Vercel)
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

// Use the Render backend URL in production, localhost in development
const API_BASE_URL = isProduction 
  ? 'https://ai-library-management-system.onrender.com/api/v1'
  : 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // You can add other default headers here, e.g., Authorization tokens
  },
});

// Optional: Interceptors for handling requests or responses globally
// Example: Add Authorization token to requests
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Or get from state management
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Example: Handle global errors (e.g., 401 Unauthorized)
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized access, e.g., redirect to login
//       console.error('Unauthorized access - redirecting to login');
//       // window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default apiClient;