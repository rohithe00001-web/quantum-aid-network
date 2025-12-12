import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Play, RotateCcw, CheckCircle2, Circle, ArrowRight, Building } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";

interface Node {
  id: string;
  name: string;
  type: "substation" | "hospital" | "fire" | "residential";
  status: "damaged" | "restored" | "pending";
  priority: number;
}

const mockNodes: Node[] = [
  { id: "n1", name: "Main Substation A", type: "substation", status: "damaged", priority: 0 },
  { id: "n2", name: "Regional Hospital", type: "hospital", status: "damaged", priority: 0 },
  { id: "n3", name: "Fire Station 5", type: "fire", status: "damaged", priority: 0 },
  { id: "n4", name: "Downtown Grid", type: "residential", status: "damaged", priority: 0 },
  { id: "n5", name: "Substation B", type: "substation", status: "damaged", priority: 0 },
  { id: "n6", name: "Emergency Center", type: "hospital", status: "damaged", priority: 0 },
];

export default function GridRecovery() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setSequence([]);
    setCurrentStep(-1);

    setTimeout(() => {
      setIsOptimizing(false);
      setSequence(["n1", "n2", "n3", "n6", "n5", "n4"]);
      
      // Animate through sequence
      let step = 0;
      const interval = setInterval(() => {
        setCurrentStep(step);
        step++;
        if (step >= 6) clearInterval(interval);
      }, 800);
    }, 2500);
  };

  const getNodeStatus = (nodeId: string) => {
    if (sequence.length === 0) return "damaged";
    const index = sequence.indexOf(nodeId);
    if (index === -1) return "damaged";
    if (index <= currentStep) return "restored";
    return "pending";
  };

  const typeIcons = {
    substation: Zap,
    hospital: Building,
    fire: Building,
    residential: Building,
  };

  const typeColors = {
    substation: "text-warning",
    hospital: "text-destructive",
    fire: "text-warning",
    residential: "text-primary",
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Grid Recovery Sequencer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Combinatorial optimization for infrastructure restoration priority
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSequence([]);
                setCurrentStep(-1);
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
              {isOptimizing ? "Computing..." : "Compute Sequence"}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Nodes */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Damaged Nodes</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {mockNodes.map((node, i) => {
                const status = getNodeStatus(node.id);
                const Icon = typeIcons[node.type];
                const sequenceIndex = sequence.indexOf(node.id);

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-lg border transition-all duration-500 ${
                      status === "restored"
                        ? "bg-success/10 border-success/30"
                        : status === "pending"
                        ? "bg-warning/10 border-warning/30"
                        : "bg-secondary/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${typeColors[node.type]}`} />
                      {sequenceIndex !== -1 && (
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                            status === "restored"
                              ? "bg-success text-success-foreground"
                              : "bg-warning/20 text-warning"
                          }`}
                        >
                          {sequenceIndex + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {node.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {status === "restored" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={`text-xs capitalize ${
                          status === "restored"
                            ? "text-success"
                            : status === "pending"
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          {/* Repair Sequence */}
          <GlassCard className="p-0" variant="quantum">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Optimal Repair Sequence</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Maximizes critical infrastructure uptime
              </p>
            </div>
            <div className="p-6">
              {isOptimizing ? (
                <div className="h-64 flex items-center justify-center">
                  <QuantumLoader size="lg" label="Computing" />
                </div>
              ) : sequence.length > 0 ? (
                <div className="space-y-3">
                  {sequence.map((nodeId, i) => {
                    const node = mockNodes.find((n) => n.id === nodeId);
                    if (!node) return null;
                    const status = getNodeStatus(nodeId);
                    const Icon = typeIcons[node.type];

                    return (
                      <motion.div
                        key={nodeId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all duration-500 ${
                            status === "restored"
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div
                          className={`flex-1 p-3 rounded-lg border transition-all duration-500 ${
                            status === "restored"
                              ? "bg-success/10 border-success/30"
                              : "bg-secondary/30 border-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${typeColors[node.type]}`} />
                            <span className="text-sm font-medium text-foreground">
                              {node.name}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {currentStep >= 5 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30 text-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm font-medium text-success">
                        Grid Fully Restored
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated time saved: 2h 47m
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <Zap className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Compute optimal repair sequence
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
