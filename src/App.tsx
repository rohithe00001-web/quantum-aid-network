import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import FleetRouting from "./pages/FleetRouting";
import ResourceAllocation from "./pages/ResourceAllocation";
import EvacuationFlow from "./pages/EvacuationFlow";
import GridRecovery from "./pages/GridRecovery";
import QVisionAnalysis from "./pages/QVisionAnalysis";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import OperatorDashboard from "./pages/dashboards/OperatorDashboard";
import VolunteerDashboard from "./pages/dashboards/VolunteerDashboard";
import UserDashboard from "./pages/dashboards/UserDashboard";
import NotFound from "./pages/NotFound";
import { QuantumLoader } from "./components/ui/QuantumLoader";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <QuantumLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function RoleBasedDashboard() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <QuantumLoader size="lg" />
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'operator':
      return <OperatorDashboard />;
    case 'volunteer':
      return <VolunteerDashboard />;
    case 'user':
    default:
      return <UserDashboard />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/command"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routing"
        element={
          <ProtectedRoute>
            <FleetRouting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourceAllocation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evacuation"
        element={
          <ProtectedRoute>
            <EvacuationFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grid"
        element={
          <ProtectedRoute>
            <GridRecovery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qvision"
        element={
          <ProtectedRoute>
            <QVisionAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
