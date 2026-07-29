import api from "./api.js";

export async function fetchPowerByDate(date) {
  try {
    const { data } = await api.get(`/api/power/${date}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

export async function createPower(payload) {
  const { data } = await api.post("/api/power", payload);
  return data;
}

export async function updatePower(date, payload) {
  const { data } = await api.put(`/api/power/${date}`, payload);
  return data;
}

export async function deletePower(date) {
  const { data } = await api.delete(`/api/power/${date}`);
  return data;
}

export async function listPower(params = {}) {
  const { data } = await api.get("/api/power", { params });
  return data;
}

export async function fetchMonthlyAnalysis(year, month) {
  const { data } = await api.get("/api/power/monthly", { params: { year, month } });
  return data;
}

export async function fetchYearlyAnalysis(year) {
  const { data } = await api.get("/api/power/yearly", { params: { year } });
  return data;
}
