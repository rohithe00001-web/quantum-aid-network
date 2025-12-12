import { useState } from "react";
import { motion } from "framer-motion";
import { Car, Play, RotateCcw, ArrowUpRight, ArrowDownRight, Gauge, Clock, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";
import { MetricCard } from "@/components/ui/MetricCard";

interface SimulationResult {
  scenario: string;
  carsPerMinute: number;
  improvement: number;
  configuration: string[];
}

export default function EvacuationFlow() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setResults([]);

    setTimeout(() => {
      setIsSimulating(false);
      setResults([
        {
          scenario: "Optimal Configuration",
          carsPerMinute: 847,
          improvement: 34,
          configuration: ["Lane reversal on HWY-101", "Green wave sync", "Divert via Route 7"],
        },
        {
          scenario: "Alternative A",
          carsPerMinute: 792,
          improvement: 25,
          configuration: ["Partial lane reversal", "Signal timing adjust", "Keep Route 7 open"],
        },
        {
          scenario: "Alternative B",
          carsPerMinute: 756,
          improvement: 20,
          configuration: ["No lane reversal", "Full signal override", "Emergency corridor"],
        },
      ]);
    }, 3500);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Quantum Flow Simulator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              VQE-powered traffic flow optimization for evacuation corridors
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
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSimulating ? (
                <QuantumLoader size="sm" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </motion.button>
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Car}
            label="Current Flow Rate"
            value="632"
            subValue="cars/minute"
            variant="default"
          />
          <MetricCard
            icon={Gauge}
            label="Congestion Level"
            value="78%"
            subValue="Heavy traffic"
            trend="down"
            variant="warning"
          />
          <MetricCard
            icon={Clock}
            label="Est. Clear Time"
            value="4h 12m"
            subValue="At current rate"
            variant="default"
          />
          <MetricCard
            icon={Users}
            label="Pending Evacuation"
            value="28,450"
            subValue="residents"
            variant="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Map Visualization */}
          <GlassCard className="p-0" variant="quantum">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Road Network</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time traffic density visualization
              </p>
            </div>
            <div className="relative h-80 bg-gradient-to-br from-secondary/30 to-background overflow-hidden">
              <div className="absolute inset-0 grid-pattern opacity-30" />
              
              {/* Simulated road network */}
              <svg className="absolute inset-0 w-full h-full">
                {/* Main highway */}
                <motion.line
                  x1="10%"
                  y1="50%"
                  x2="90%"
                  y2="50%"
                  stroke="hsl(var(--warning))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />
                {/* Secondary roads */}
                <motion.line
                  x1="30%"
                  y1="20%"
                  x2="30%"
                  y2="80%"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                <motion.line
                  x1="60%"
                  y1="20%"
                  x2="60%"
                  y2="80%"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                
                {/* Animated traffic flow */}
                {isSimulating && (
                  <>
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="4"
                      fill="hsl(var(--primary))"
                      animate={{
                        cx: ["10%", "90%"],
                        cy: ["50%", "50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="4"
                      fill="hsl(var(--primary))"
                      animate={{
                        cx: ["20%", "100%"],
                        cy: ["50%", "50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5,
                      }}
                    />
                  </>
                )}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Congested</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Clear</span>
                </div>
              </div>

              {isSimulating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                  <QuantumLoader size="lg" label="VQE Processing" />
                </div>
              )}
            </div>
          </GlassCard>

          {/* Simulation Results */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Simulation Results</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ranked optimization scenarios
              </p>
            </div>
            <div className="p-4 space-y-4">
              {results.length > 0 ? (
                results.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={`p-4 rounded-lg border ${
                      i === 0
                        ? "bg-success/5 border-success/30"
                        : "bg-secondary/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-success text-success-foreground">
                            OPTIMAL
                          </span>
                        )}
                        <span className="font-medium text-foreground">
                          {result.scenario}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-success">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="font-mono text-sm">+{result.improvement}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="font-mono text-2xl text-foreground">
                          {result.carsPerMinute}
                        </p>
                        <p className="text-xs text-muted-foreground">cars/minute</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.configuration.map((config, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                        >
                          {config}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <Car className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Run simulation to see optimization results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
