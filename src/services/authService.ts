import api from "@/lib/api";

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");

  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("user");

  delete api.defaults.headers.common.Authorization;
}