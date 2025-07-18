import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // allow cookies
});

export const signupUser = (data) => API.post("/auth/signup", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getCurrentUser = () => API.get("/auth/me");
export const logoutUser = () => API.post("/auth/logout");
