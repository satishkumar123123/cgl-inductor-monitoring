import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

// Route-level code splitting
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const AnalyticsDashboardPage = lazy(() => import("./pages/AnalyticsDashboardPage.jsx"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage.jsx"));
const PmPotReportPage = lazy(() => import("./pages/reports/PmPotReportPage.jsx"));
const MainPotReportPage = lazy(() => import("./pages/reports/MainPotReportPage.jsx"));
const ReportHistoryPage = lazy(() => import("./pages/reports/ReportHistoryPage.jsx"));
const PowerConsumptionPage = lazy(() => import("./pages/power/PowerConsumptionPage.jsx"));
const MonthlyAnalysisPage = lazy(() => import("./pages/power/MonthlyAnalysisPage.jsx"));
const YearlyAnalysisPage = lazy(() => import("./pages/power/YearlyAnalysisPage.jsx"));
const ProductionDrossPage = lazy(() => import("./pages/ProductionDrossPage.jsx"));

const page = (Component) => (
  <Suspense fallback={<LoadingSpinner fullScreen label="Loading page…" />}>
    <Component />
  </Suspense>
);

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={<AuthLayout>{page(LoginPage)}</AuthLayout>}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>{page(DashboardPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/production-dross"
          element={
            <ProtectedRoute>
              <MainLayout>{page(ProductionDrossPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <MainLayout>{page(HistoryPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>{page(AnalyticsDashboardPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <MainLayout>{page(AuditLogPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/pm-pot"
          element={
            <ProtectedRoute>
              <MainLayout>{page(PmPotReportPage)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/main-pot"
          element={
            <ProtectedRoute>
              <MainLayout>{page(MainPotReportPage)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/history"
          element={
            <ProtectedRoute>
              <MainLayout>{page(ReportHistoryPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/power/consumption"
          element={
            <ProtectedRoute>
              <MainLayout>{page(PowerConsumptionPage)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/power/monthly"
          element={
            <ProtectedRoute>
              <MainLayout>{page(MonthlyAnalysisPage)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/power/yearly"
          element={
            <ProtectedRoute>
              <MainLayout>{page(YearlyAnalysisPage)}</MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={page(NotFoundPage)} />
      </Routes>
      <ToastContainer />
    </>
  );
}