import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { DataProvider } from "./lib/data";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import LiveOperations from "./pages/LiveOperations";
import DriverPerformance from "./pages/DriverPerformance";
import Financial from "./pages/Financial";
import SafetyCompliance from "./pages/SafetyCompliance";
import Forecasting from "./pages/Forecasting";
import FleetLayout from "./pages/FleetLayout";
import Fleet from "./pages/Fleet";
import FleetDispatch from "./pages/FleetDispatch";
import FleetMaintenance from "./pages/FleetMaintenance";
import FleetKpis from "./pages/FleetKpis";
import VehicleDetail from "./pages/VehicleDetail";
import Scorecard from "./pages/Scorecard";
import ScorecardLayout from "./pages/scorecard/ScorecardLayout";
import ExecutiveScorecard from "./pages/scorecard/ExecutiveScorecard";
import DriverImpact from "./pages/scorecard/DriverImpact";
import RouteImpact from "./pages/scorecard/RouteImpact";
import Recommendations from "./pages/scorecard/Recommendations";
import ScorecardForecast from "./pages/scorecard/ScorecardForecast";
import RoutesBoard from "./pages/Routes";
import Insights from "./pages/Insights";
import Imports from "./pages/Imports";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<ExecutiveDashboard />} />
        <Route path="operations" element={<LiveOperations />} />
        <Route path="drivers" element={<DriverPerformance />} />
        <Route path="financial" element={<Financial />} />
        <Route path="safety" element={<SafetyCompliance />} />
        <Route path="forecasting" element={<Forecasting />} />
        <Route path="fleet" element={<FleetLayout />}>
          <Route index element={<Fleet />} />
          <Route path="dispatch" element={<FleetDispatch />} />
          <Route path="maintenance" element={<FleetMaintenance />} />
          <Route path="kpis" element={<FleetKpis />} />
          <Route path="vehicles/:vehicleId" element={<VehicleDetail />} />
        </Route>
        <Route path="scorecard" element={<ScorecardLayout />}>
          <Route index element={<ExecutiveScorecard />} />
          <Route path="stations" element={<Scorecard />} />
          <Route path="drivers" element={<DriverImpact />} />
          <Route path="routes" element={<RouteImpact />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="forecast" element={<ScorecardForecast />} />
        </Route>
        <Route path="routes" element={<RoutesBoard />} />
        <Route path="insights" element={<Insights />} />
        <Route path="imports" element={<Imports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
