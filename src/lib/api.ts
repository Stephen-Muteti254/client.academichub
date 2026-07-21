import axios from "axios";

import { PORTALS } from "@/config/portals";
import { clearAuth } from "@/services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://order-analytics.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ----------------------------------------
 * Request interceptor
 * --------------------------------------*/
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set multipart boundaries
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------------------
 * Response interceptor
 * --------------------------------------*/

let isRedirecting = false;
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403 &&
      !isRedirecting) {

      isRedirecting = true;
      clearAuth();
      window.location.replace(PORTALS.AUTH);

    }

    return Promise.reject(error);
  }
);

export default api;