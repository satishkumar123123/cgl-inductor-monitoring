// src/services/dataService.js
import api from "./api.js";

// 1. FETCH DATA BY SPECIFIC DATE
export async function fetchDataByDate(date) {
  try {
    const { data } = await api.get(`/api/data/${date}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// 2. CREATE / SAVE DASHBOARD DATA
export async function createData(payload) {
  const { data } = await api.post("/api/data", payload);
  return data;
}

// 3. UPDATE DATA BY DATE
export async function updateData(date, payload) {
  const { data } = await api.put(`/api/data/${date}`, payload);
  return data;
}

// 4. DELETE DATA BY DATE
export async function deleteData(date) {
  const { data } = await api.delete(`/api/data/${date}`);
  return data;
}

// 5. FETCH ALL HISTORY DATA (UPDATED ROUTE & SAFETY CHECK)
export async function fetchHistory(params = {}) {
  try {
    // History ke liye /api/data URL par request jayegi
    const { data } = await api.get("/api/data", { params });

    // Ensure array format return ho taaki frontend crash na ho
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.records)) {
      return data.records;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (err) {
    console.error("Error in fetchHistory:", err);
    throw err;
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