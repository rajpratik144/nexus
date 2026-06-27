import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Required to send/receive cookies
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid loops: Don't retry if the failing request WAS the refresh or login call
    const isAuthRequest = originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh'); // This will set new cookies on success
        return api(originalRequest);    // Retry the original failed call
      } catch (refreshError) {
        // If refresh fails, we truly are logged out
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;