import api from "./api.js";

export async function fetchAuditLogs(params = {}) {
  const { data } = await api.get("/api/audit-logs", { params });
  return data;
}
