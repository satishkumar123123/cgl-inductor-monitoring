import api from "./api.js";

export async function loginRequest(username, password) {
  const { data } = await api.post("/api/auth/login", { username, password });
  return data; // { token, user }
}

export function getCurrentUser() {
  const raw = localStorage.getItem("cgl_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("cgl_token");
  localStorage.removeItem("cgl_user");
}
