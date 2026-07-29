// src/services/dataService.js
import api from "./api.js";

// 1. FETCH DATA BY SPECIFIC DATE
export async function fetchDataByDate(date) {
  try {
    const { data } = await api.get(`/api/data/${date}`);
    return data?.data || data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// 2. CREATE / SAVE DASHBOARD DATA
export async function createData(payload) {
  try {
    const { data } = await api.post("/api/data", payload);
    return data?.data || data;
  } catch (err) {
    console.error("Create Data Error:", err);
    throw err;
  }
}

// 3. UPDATE DATA BY DATE
export async function updateData(date, payload) {
  try {
    const { data } = await api.put(`/api/data/${date}`, payload);
    return data?.data || data;
  } catch (err) {
    console.error("Update Data Error:", err);
    throw err;
  }
}

// 4. DELETE DATA BY DATE
export async function deleteData(date) {
  const { data } = await api.delete(`/api/data/${date}`);
  return data;
}

// 5. FETCH ALL HISTORY DATA (CORRECT ROUTE: /api/history)
export async function fetchHistory(params = {}) {
  try {
    // Correct Endpoint according to server.js
    const { data } = await api.get("/api/history", { params });

    // Safe array extraction
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (data && Array.isArray(data.history)) {
      return data.history;
    } else if (data && Array.isArray(data.records)) {
      return data.records;
    }

    return [];
  } catch (err) {
    console.error("Error in fetchHistory:", err);
    return [];
  }
}

// 6. UPLOAD EXCEL FILE
export async function uploadExcel(file, date) {
  const form = new FormData();
  form.append("file", file);
  form.append("date", date);
  const { data } = await api.post("/api/upload-excel", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}