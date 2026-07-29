import React from "react";
import AnalysisReportView from "../../components/AnalysisReportView.jsx";
import { fetchMainPotReport } from "../../services/reportService.js";

export default function MainPotReportPage() {
  return (
    <AnalysisReportView
      title="CGL Main Pot Daily Analysis Report"
      reportType="Main Pot Analysis"
      elementId="main-pot-report-content"
      fetchReport={fetchMainPotReport}
    />
  );
}
