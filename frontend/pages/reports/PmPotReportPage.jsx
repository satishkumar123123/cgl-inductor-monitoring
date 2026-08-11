import React from "react";
import AnalysisReportView from "../../components/AnalysisReportView.jsx";
import { fetchPmPotReport } from "../../services/reportService.js";

export default function PmPotReportPage() {
  return (
    <AnalysisReportView
      title="CGL PM Pot Daily Analysis Report"
      reportType="PM Pot Analysis"
      elementId="pm-pot-report-content"
      fetchReport={fetchPmPotReport}
    />
  );
}