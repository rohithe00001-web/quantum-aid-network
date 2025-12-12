import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Building, ArrowRight, Play, RotateCcw, Scale } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";

interface Resource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: "medical" | "food" | "water" | "equipment";
}

interface Shelter {
  id: string;
  name: string;
  population: number;
  needs: { resourceId: string; quantity: number }[];
}

const mockResources: Resource[] = [
  { id: "r1", name: "Medical Kits", quantity: 500, unit: "kits", category: "medical" },
  { id: "r2", name: "Insulin Doses", quantity: 200, unit: "doses", category: "medical" },
  { id: "r3", name: "MRE Packages", quantity: 2000, unit: "units", category: "food" },
  { id: "r4", name: "Water Bottles", quantity: 5000, unit: "liters", category: "water" },
  { id: "r5", name: "Generators", quantity: 15, unit: "units", category: "equipment" },
];

const mockShelters: Shelter[] = [
  { id: "s1", name: "Central High School", population: 450, needs: [{ resourceId: "r1", quantity: 50 }, { resourceId: "r3", quantity: 400 }] },
  { id: "s2", name: "Community Arena", population: 800, needs: [{ resourceId: "r2", quantity: 30 }, { resourceId: "r4", quantity: 1600 }] },
  { id: "s3", name: "Convention Center", population: 1200, needs: [{ resourceId: "r3", quantity: 1000 }, { resourceId: "r5", quantity: 5 }] },
];

export default function ResourceAllocation() {
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationResult, setAllocationResult] = useState<any>(null);

  const handleAllocate = () => {
    setIsAllocating(true);
    setAllocationResult(null);

    setTimeout(() => {
      setIsAllocating(false);
      setAllocationResult({
        success: true,
        allocations: [
          { shelter: "Central High School", resources: "Medical Kits (50), MRE (400)" },
          { shelter: "Community Arena", resources: "Insulin (30), Water (1600L)" },
          { shelter: "Convention Center", resources: "MRE (1000), Generators (5)" },
        ],
        efficiency: 97,
        waste: 3,
      });
    }, 2500);
  };

  const categoryColors = {
    medical: "text-destructive bg-destructive/10 border-destructive/20",
    food: "text-warning bg-warning/10 border-warning/20",
    water: "text-primary bg-primary/10 border-primary/20",
    equipment: "text-success bg-success/10 border-success/20",
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Equity-Based Supply Distributor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              QUBO optimization for multi-objective resource allocation
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
              onClick={handleAllocate}
              disabled={isAllocating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isAllocating ? (
                <QuantumLoader size="sm" />
              ) : (
                <Scale className="w-4 h-4" />
              )}
              {isAllocating ? "Allocating..." : "Optimize Distribution"}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Resources */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Available Stock</h2>
            </div>
            <div className="p-4 space-y-3">
              {mockResources.map((resource, i) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {resource.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono uppercase border ${
                        categoryColors[resource.category]
                      }`}
                    >
                      {resource.category}
                    </span>
                  </div>
                  <div className="font-mono text-lg text-foreground">
                    {resource.quantity.toLocaleString()}{" "}
                    <span className="text-sm text-muted-foreground">
                      {resource.unit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Visualization */}
          <GlassCard className="p-0" variant="quantum">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Allocation Flow</h2>
            </div>
            <div className="p-6 min-h-[400px] flex items-center justify-center">
              {isAllocating ? (
                <div className="text-center space-y-4">
                  <QuantumLoader size="lg" label="QUBO Solving" />
                  <p className="text-sm text-muted-foreground">
                    Solving multi-objective knapsack problem...
                  </p>
                </div>
              ) : allocationResult ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full space-y-4"
                >
                  {allocationResult.allocations.map((alloc: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                    >
                      <Package className="w-4 h-4 text-success" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alloc.shelter}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alloc.resources}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                      <p className="font-mono text-2xl text-success">
                        {allocationResult.efficiency}%
                      </p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                      <p className="font-mono text-2xl text-warning">
                        {allocationResult.waste}%
                      </p>
                      <p className="text-xs text-muted-foreground">Waste</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run optimization to see allocation flow
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Shelter Needs */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Shelter Requirements</h2>
            </div>
            <div className="p-4 space-y-3">
              {mockShelters.map((shelter, i) => (
                <motion.div
                  key={shelter.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {shelter.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground">
                      Pop: {shelter.population}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Needs:{" "}
                    {shelter.needs
                      .map((n) => {
                        const resource = mockResources.find((r) => r.id === n.resourceId);
                        return `${resource?.name} (${n.quantity})`;
                      })
                      .join(", ")}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
