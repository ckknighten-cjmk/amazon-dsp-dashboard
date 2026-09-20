import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import LiveOperations from "./pages/LiveOperations";
import DriverPerformance from "./pages/DriverPerformance";
import Financial from "./pages/Financial";
import SafetyCompliance from "./pages/SafetyCompliance";
import Forecasting from "./pages/Forecasting";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExecutiveDashboard />} />
        <Route path="operations" element={<LiveOperations />} />
        <Route path="drivers" element={<DriverPerformance />} />
        <Route path="financial" element={<Financial />} />
        <Route path="safety" element={<SafetyCompliance />} />
        <Route path="forecasting" element={<Forecasting />} />
      </Route>
    </Routes>
  );
}
