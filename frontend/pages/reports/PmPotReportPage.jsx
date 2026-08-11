import React from "react";
import AnalysisReportView from "../../components/AnalysisReportView.jsx";
import { fetchPmPotReport } from "../../services/reportService.js";

export default function PmPotReportPage() {
  return (
    <AnalysisReportView
      title={
        <span className="font-black text-cyan-900 uppercase tracking-wide text-2xl md:text-3xl">
          CGL PM POT DAILY ANALYSIS REPORT
        </span>
      }
      reportType="PM Pot Analysis"
      elementId="pm-pot-report-content"
      fetchReport={fetchPmPotReport}
    />
  );
}