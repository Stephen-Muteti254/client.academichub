import axios from "axios";

import { PORTALS } from "@/config/portals";
import { clearAuth } from "@/services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://api.academichubpro.com/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {

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