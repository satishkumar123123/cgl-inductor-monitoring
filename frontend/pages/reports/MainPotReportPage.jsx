import React from "react";
import AnalysisReportView from "../../components/AnalysisReportView.jsx";
import { fetchMainPotReport } from "../../services/reportService.js";

export default function MainPotReportPage() {
  return (
    <AnalysisReportView
      title={
        <span className="font-black text-indigo-950 uppercase tracking-wide text-2xl md:text-3xl">
          CGL MAIN POT DAILY ANALYSIS REPORT
        </span>
      }
      reportType="Main Pot Analysis"
      elementId="main-pot-report-content"
      fetchReport={fetchMainPotReport}
    />
  );
}