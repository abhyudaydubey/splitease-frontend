import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1'; // Replace with actual backend URL

// Create an axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor (optional if you use auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions

// User Registration
export const registerUser = async ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await axios.post(`${BASE_URL}/auth/register/`, {
    username,
    email,
    password,
  });
  return response.data;
};

//UserLogin
export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await axios.post(`${BASE_URL}/auth/login/`, {
    email,
    password,
  });
  return response.data;
};

export const addFriend = async (friendEmail: string) => {
  return await api.post('/friends/add', { email: friendEmail });
};

export const createGroup = async (groupData: {
  name: string;
  members: string[];
  description?: string;
}) => {
  return await api.post('/groups/create', groupData);
};

export const fetchDashboardData = async () => {
  return await api.get('/dashboard');
};

// Export axios instance if needed directly
export default api;
