import axios from "axios";

// In local dev, Vite proxies "/api" to the backend (see vite.config.js), so
// the relative path works with no config. In production the frontend and
// backend are usually deployed to two different domains, so VITE_API_URL
// must be set at build time to the deployed backend's URL, e.g.:
// VITE_API_URL=https://your-backend.onrender.com/api
const baseURL = import.meta.env.VITE_API_URL || "/api";

const axiosClient = axios.create({
  baseURL,
});
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default axiosClient;