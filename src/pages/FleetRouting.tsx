import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Play, MapPin, Clock, Package, Fuel, RotateCcw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { FleetManager } from "@/components/fleet/FleetManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Destination {
  id: string;
  name: string;
  priority: "critical" | "high" | "medium" | "low";
  demand: number;
}

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
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    fetchVehicleCount();

    const channel = supabase
      .channel('fleet_routing_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, () => {
        fetchVehicleCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVehicleCount = async () => {
    const { count } = await supabase
      .from('fleet_vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');
    
    setVehicleCount(count || 0);
  };

  const handleOptimize = async () => {
    if (vehicleCount === 0) {
      toast({
        title: 'No Vehicles Available',
        description: 'Add some fleet vehicles before running optimization',
        variant: 'destructive'
      });
      return;
    }

    setIsOptimizing(true);
    setOptimizationResult(null);
    
    // Simulate quantum optimization
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationResult(`Quantum annealing complete. Optimal routes calculated for ${vehicleCount} vehicles covering ${mockDestinations.length} destinations. Total estimated time: 2h 34m. Fuel efficiency: 94%.`);
      toast({
        title: 'Optimization Complete',
        description: 'Optimal routes have been calculated'
      });
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
            <button 
              onClick={() => {
                setOptimizationResult(null);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
            >
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

        {/* Fleet Manager */}
        <FleetManager />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      Solving VRP with {vehicleCount} vehicles × {mockDestinations.length} destinations
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
                    Add fleet vehicles above, then run the quantum solver
                  </p>
                  <p className="text-xs text-quantum-cyan">
                    {vehicleCount} vehicles available
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