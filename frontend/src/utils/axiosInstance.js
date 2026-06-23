import axios from 'axios';

// 1. Point to the Backend (Port 5000)
// In production, you will change this variable in your deployment dashboard
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Important: Sends cookies/tokens with every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor: Automatically attach the Token if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;