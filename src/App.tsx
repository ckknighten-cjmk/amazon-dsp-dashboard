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
import Fleet from "./pages/Fleet";
import Scorecard from "./pages/Scorecard";
import RoutesBoard from "./pages/Routes";
import Insights from "./pages/Insights";
import Imports from "./pages/Imports";
import MorningDispatch from "./pages/MorningDispatch";
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
        <Route path="dispatch" element={<MorningDispatch />} />
        <Route path="operations" element={<LiveOperations />} />
        <Route path="drivers" element={<DriverPerformance />} />
        <Route path="financial" element={<Financial />} />
        <Route path="safety" element={<SafetyCompliance />} />
        <Route path="forecasting" element={<Forecasting />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="scorecard" element={<Scorecard />} />
        <Route path="routes" element={<RoutesBoard />} />
        <Route path="insights" element={<Insights />} />
        <Route path="imports" element={<Imports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
