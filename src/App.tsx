import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import LiveOperations from "./pages/LiveOperations";
import DriverPerformance from "./pages/DriverPerformance";
import Financial from "./pages/Financial";
import SafetyCompliance from "./pages/SafetyCompliance";
import Forecasting from "./pages/Forecasting";
import ScorecardLayout from "./pages/scorecard/ScorecardLayout";
import ExecutiveScorecard from "./pages/scorecard/ExecutiveScorecard";
import DriverImpact from "./pages/scorecard/DriverImpact";
import RouteImpact from "./pages/scorecard/RouteImpact";
import Recommendations from "./pages/scorecard/Recommendations";
import ScorecardForecast from "./pages/scorecard/ScorecardForecast";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExecutiveDashboard />} />
        <Route path="operations" element={<LiveOperations />} />
        <Route path="drivers" element={<DriverPerformance />} />
        <Route path="scorecard" element={<ScorecardLayout />}>
          <Route index element={<ExecutiveScorecard />} />
          <Route path="drivers" element={<DriverImpact />} />
          <Route path="routes" element={<RouteImpact />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="forecast" element={<ScorecardForecast />} />
        </Route>
        <Route path="financial" element={<Financial />} />
        <Route path="safety" element={<SafetyCompliance />} />
        <Route path="forecasting" element={<Forecasting />} />
      </Route>
    </Routes>
  );
}
