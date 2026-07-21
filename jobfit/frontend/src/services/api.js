import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5001/api" });

API.interceptors.request.use((config) => {
  const user = localStorage.getItem("userInfo");
  if (user) {
    try {
      const { token } = JSON.parse(user);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error parsing user info:", error);
    }
  }
  return config;
});

// Auth
export const login = (email, password) => 
  API.post("/users/login", { email, password });

export const register = (name, email, password) => 
  API.post("/users/register", { name, email, password });

// Resume
export const enhanceResume = (formData) => 
  API.post("/resume/enhance", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getResume = (id) => API.get(`/resume/${id}`);
export const getHistory = () => API.get("/resume/history");

// 🔴 Download URL with token
export const getDownloadUrl = (id) => {
  const user = localStorage.getItem("userInfo");
  if (user) {
    try {
      const { token } = JSON.parse(user);
      return `http://localhost:5001/api/resume/${id}/download?token=${token}`;
    } catch {}
  }
  return null;
};