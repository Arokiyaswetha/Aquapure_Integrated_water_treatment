import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DigitalTwin from "./pages/DigitalTwin";
import Distribution from "./pages/Distribution";
import Groundwater from "./pages/Groundwater";
import Compliance from "./pages/Compliance";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Recovery from "./pages/Recovery";
import Plant3D from "./pages/Plant3D";
import Potability from "./pages/Potability";
import Effluent from "./pages/Effluent";
import Maintenance from "./pages/Maintenance";
import Nutrients from "./pages/Nutrients";
import Anomaly from "./pages/Anomaly";
import Benchmarks from "./pages/Benchmarks";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/digital-twin" element={<DigitalTwin />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/groundwater" element={<Groundwater />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recovery" element={<Recovery />} />

          <Route path="/plant3d" element={<Plant3D />} />
          <Route path="/potability" element={<Potability />} />
          <Route path="/effluent" element={<Effluent />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/nutrients" element={<Nutrients />} />
          <Route path="/anomaly" element={<Anomaly />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
