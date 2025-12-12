import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FleetRouting from "./pages/FleetRouting";
import ResourceAllocation from "./pages/ResourceAllocation";
import EvacuationFlow from "./pages/EvacuationFlow";
import GridRecovery from "./pages/GridRecovery";
import QVisionAnalysis from "./pages/QVisionAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/routing" element={<FleetRouting />} />
          <Route path="/resources" element={<ResourceAllocation />} />
          <Route path="/evacuation" element={<EvacuationFlow />} />
          <Route path="/grid" element={<GridRecovery />} />
          <Route path="/qvision" element={<QVisionAnalysis />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
