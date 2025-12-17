import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  requestLogin: (email, firstName, lastName) =>
    apiClient.post('/auth/request-login', { email, firstName, lastName }),
  verifyLogin: (token) =>
    apiClient.post('/auth/verify-login', { token }),
  getMe: () =>
    apiClient.get('/auth/me'),
};

export const shows = {
  getAll: () =>
    apiClient.get('/shows'),
  getById: (id) =>
    apiClient.get(`/shows/${id}`),
};

export const bookings = {
  create: (seatId, showId) =>
    apiClient.post('/bookings', { seatId, showId }),
  getMyBookings: () =>
    apiClient.get('/bookings/my-bookings'),
  checkIn: (confirmationToken) =>
    apiClient.post(`/bookings/check-in/${confirmationToken}`),
};

export const seats = {
  getByShow: (showId) =>
    apiClient.get(`/seats/show/${showId}`),
};

export default apiClient;
