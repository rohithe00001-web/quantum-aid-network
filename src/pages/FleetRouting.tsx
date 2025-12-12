import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Play, MapPin, Clock, Package, Fuel, RotateCcw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

interface Vehicle {
  id: string;
  name: string;
  capacity: number;
  fuel: number;
  status: "available" | "en-route" | "maintenance";
}

interface Destination {
  id: string;
  name: string;
  priority: "critical" | "high" | "medium" | "low";
  demand: number;
}

const mockVehicles: Vehicle[] = [
  { id: "v1", name: "Alpha-7", capacity: 1000, fuel: 85, status: "available" },
  { id: "v2", name: "Bravo-3", capacity: 800, fuel: 92, status: "available" },
  { id: "v3", name: "Charlie-9", capacity: 1200, fuel: 45, status: "en-route" },
  { id: "v4", name: "Delta-2", capacity: 600, fuel: 100, status: "available" },
];

const mockDestinations: Destination[] = [
  { id: "d1", name: "Central Hospital", priority: "critical", demand: 500 },
  { id: "d2", name: "Shelter A-1", priority: "high", demand: 300 },
  { id: "d3", name: "Fire Station 12", priority: "high", demand: 200 },
  { id: "d4", name: "Community Center", priority: "medium", demand: 400 },
  { id: "d5", name: "School District HQ", priority: "low", demand: 150 },
];

export default function FleetRouting() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    
    // Simulate quantum optimization
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationResult("Quantum annealing complete. Optimal routes calculated for 4 vehicles covering 5 destinations. Total estimated time: 2h 34m. Fuel efficiency: 94%.");
    }, 3000);
  };

  const priorityColors = {
    critical: "text-destructive border-destructive/30 bg-destructive/10",
    high: "text-warning border-warning/30 bg-warning/10",
    medium: "text-primary border-primary/30 bg-primary/10",
    low: "text-muted-foreground border-border bg-muted/50",
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Multi-Fleet Dynamic Routing
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quantum-powered vehicle routing optimization using D-Wave annealing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isOptimizing ? (
                <QuantumLoader size="sm" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isOptimizing ? "Optimizing..." : "Run Quantum Solver"}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicles Panel */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Fleet Vehicles</h2>
              </div>
              <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {mockVehicles.map((vehicle, i) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {vehicle.name}
                    </span>
                    <StatusIndicator
                      status={
                        vehicle.status === "available"
                          ? "online"
                          : vehicle.status === "en-route"
                          ? "processing"
                          : "warning"
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>{vehicle.capacity} kg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>{vehicle.fuel}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Destinations Panel */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Destinations</h2>
              </div>
              <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {mockDestinations.map((dest, i) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {dest.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${
                        priorityColors[dest.priority]
                      }`}
                    >
                      {dest.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>Demand: {dest.demand} units</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Optimization Result */}
          <GlassCard className="p-0" variant="quantum">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Optimization Status</h2>
            </div>
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              {isOptimizing ? (
                <div className="text-center space-y-4">
                  <QuantumLoader size="lg" label="Processing" />
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      Quantum annealing in progress...
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Solving VRP with 4 vehicles × 5 destinations
                    </p>
                  </div>
                </div>
              ) : optimizationResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 w-full"
                >
                  <div className="flex items-center gap-2 text-success">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="font-mono text-sm uppercase">Optimization Complete</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {optimizationResult}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="font-mono text-lg text-success">2h 34m</p>
                      <p className="text-xs text-muted-foreground">Total Time</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-mono text-lg text-primary">94%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configure vehicles and destinations, then run the quantum solver
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
