import api from "./api.js";

export async function fetchAnalytics(params = {}) {
  const { data } = await api.get("/api/analytics", { params });
  return data;
}
