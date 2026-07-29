import api from "./api.js";

export async function fetchPmPotReport(date) {
  const { data } = await api.get(`/api/reports/pm-pot/${date}`);
  return data;
}

export async function fetchMainPotReport(date) {
  const { data } = await api.get(`/api/reports/main-pot/${date}`);
  return data;
}

export async function fetchReportPreview(reportType, date) {
  const { data } = await api.get(`/api/reports/preview/${reportType}/${date}`);
  return data;
}

export async function logReport(payload) {
  const { data } = await api.post("/api/reports/log", payload);
  return data;
}

export async function fetchReportHistory(params = {}) {
  const { data } = await api.get("/api/reports/history", { params });
  return data;
}

export async function deleteReportHistory(id) {
  const { data } = await api.delete(`/api/reports/history/${id}`);
  return data;
}
