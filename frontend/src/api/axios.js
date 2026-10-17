
import axios from "axios";

const api = axios.create({
  // baseURL: "https://food-delivery-backend-yxjs.onrender.com/api",
  baseURL: "http://localhost:5000/api",

  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
