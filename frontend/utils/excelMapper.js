// src/utils/excelMapper.js
import * as XLSX from "xlsx";
import { ROWS, POTS, emptyRecord } from "./rowsConfig.js";

// Normalize header text for easy matching
const cleanKey = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          throw new Error("Excel sheet is empty!");
        }

        // Initialize empty pots structure using emptyRecord()
        const dummy = emptyRecord();
        const potUpdates = {
          mainPot: dummy.mainPot,
          pmPot: dummy.pmPot,
        };

        let rowsImported = 0;
        let errors = [];

        // Parse row by row
        jsonData.forEach((row) => {
          if (!row || row.length === 0) return;

          // Try to identify parameter row name from column 0 or 1
          const paramName = String(row[0] || row[1] || "").trim();
          if (!paramName) return;

          // Find matching rowId from rowsConfig
          const matchedRow = ROWS.find(
            (r) =>
              cleanKey(r.label) === cleanKey(paramName) ||
              cleanKey(r.id) === cleanKey(paramName)
          );

          if (matchedRow) {
            rowsImported++;
            let colIndex = 2; // Data values usually start after parameter name column

            // Map values sequentially across Pots and Inductors
            Object.values(POTS).forEach((pot) => {
              pot.inductors.forEach((ind) => {
                ["high", "intermediate"].forEach((lvl) => {
                  const val = row[colIndex];
                  if (val !== undefined && val !== null && val !== "") {
                    const numVal = parseFloat(val);
                    potUpdates[pot.key][ind][lvl][matchedRow.id] = isNaN(numVal) ? String(val) : numVal;
                  }
                  colIndex++;
                });
              });
            });
          }
        });

        resolve({
          potUpdates,
          rowsImported,
          unmatched: 0,
          errors,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Helper to generate Sample Excel Template for user download
export function downloadSampleTemplate() {
  const headers = ["Parameter ID", "Parameter Name"];
  
  Object.values(POTS).forEach((pot) => {
    pot.inductors.forEach((ind) => {
      const potPrefix = pot.key === "mainPot" ? "Main" : "PM";
      headers.push(`${potPrefix} ${ind} (High)`);
      headers.push(`${potPrefix} ${ind} (Interm)`);
    });
  });

  const sampleRows = [headers];

  ROWS.forEach((r) => {
    const row = [r.id, r.label];
    // Add sample numeric readings
    for (let i = 2; i < headers.length; i++) {
      row.push(r.id.toLowerCase().includes("pf") ? 0.95 : 120);
    }
    sampleRows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inductor Readings");
  XLSX.writeFile(wb, "CGL_Sample_Reading_Template.xlsx");
}

export function exportRecordToExcel(record, filename = "CGL_Inductor_Data") {
  const headers = ["Parameter ID", "Parameter Name"];
  
  Object.values(POTS).forEach((pot) => {
    pot.inductors.forEach((ind) => {
      const potPrefix = pot.key === "mainPot" ? "Main" : "PM";
      headers.push(`${potPrefix} ${ind} (High)`);
      headers.push(`${potPrefix} ${ind} (Interm)`);
    });
  });

  const rows = [headers];

  ROWS.forEach((r) => {
    const row = [r.id, r.label];
    Object.values(POTS).forEach((pot) => {
      pot.inductors.forEach((ind) => {
        ["high", "intermediate"].forEach((lvl) => {
          row.push(record?.[pot.key]?.[ind]?.[lvl]?.[r.id] ?? "");
        });
      });
    });
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Readings");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}