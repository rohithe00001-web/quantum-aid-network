import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { QuantumLoader } from '@/components/ui/QuantumLoader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Play, Map, Sliders, FlaskConical, 
  Truck, Users, AlertTriangle, Zap,
  BarChart3, RefreshCw
} from 'lucide-react';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationType, setOptimizationType] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeVehicles: 24,
    pendingSOS: 12,
    sheltersActive: 8,
    resourcesDeployed: 156
  });

  const executeQuantumOptimization = async (type: string, algorithm: string) => {
    if (!user) return;

    setIsOptimizing(true);
    setOptimizationType(type);

    try {
      // Log the operation
      const { error } = await supabase.from('quantum_operations').insert({
        operator_id: user.id,
        operation_type: type,
        algorithm: algorithm,
        status: 'running',
        parameters: { initiated_at: new Date().toISOString() }
      });

      if (error) throw error;

      // Simulate quantum processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: 'Optimization Complete',
        description: `${type} optimization finished using ${algorithm}`
      });
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'An error occurred during quantum processing',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
      setOptimizationType(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Operator Command Center</h1>
            <p className="text-muted-foreground">Dispatcher / Commander Interface</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs bg-quantum-cyan/20 text-quantum-cyan rounded-full border border-quantum-cyan/30">
              COMMANDER ACCESS
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Vehicles"
            value={stats.activeVehicles}
            icon={Truck}
            trend="up"
            subValue="Fleet deployed"
          />
          <MetricCard
            label="Pending SOS"
            value={stats.pendingSOS}
            icon={AlertTriangle}
            trend="down"
            subValue="Awaiting response"
          />
          <MetricCard
            label="Shelters Active"
            value={stats.sheltersActive}
            icon={Users}
            trend="up"
            subValue="Receiving victims"
          />
          <MetricCard
            label="Resources Deployed"
            value={stats.resourcesDeployed}
            icon={BarChart3}
            trend="up"
            subValue="Units distributed"
          />
        </div>

        {/* Execute Quantum Optimization */}
        <GlassCard className="p-6" variant="quantum">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            Execute Quantum Optimization
          </h3>

          {isOptimizing ? (
            <div className="flex flex-col items-center py-8">
              <QuantumLoader size="lg" />
              <p className="mt-4 text-quantum-cyan animate-pulse">
                Running {optimizationType}...
              </p>
              <p className="text-sm text-muted-foreground">
                Quantum annealing in progress
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => executeQuantumOptimization('Fleet Routing', 'D-Wave Quantum Annealing')}
                className="h-auto py-6 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 border border-quantum-cyan/30 text-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Play className="w-8 h-8 text-quantum-cyan" />
                  <span className="font-semibold">Optimize Fleet Routes</span>
                  <span className="text-xs text-muted-foreground">D-Wave Quantum Annealing</span>
                </div>
              </Button>

              <Button
                onClick={() => executeQuantumOptimization('Supply Allocation', 'QUBO Optimization')}
                className="h-auto py-6 bg-quantum-purple/20 hover:bg-quantum-purple/30 border border-quantum-purple/30 text-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Play className="w-8 h-8 text-quantum-purple" />
                  <span className="font-semibold">Optimize Supply Distribution</span>
                  <span className="text-xs text-muted-foreground">QUBO Optimization</span>
                </div>
              </Button>
            </div>
          )}
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Heatmap / God View */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-quantum-cyan" />
              God View - Operations Heatmap
            </h3>

            <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center border border-border/30">
              <div className="text-center space-y-2">
                <Map className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Full operations heatmap</p>
                <p className="text-xs text-muted-foreground">Victims • Volunteers • Blocked Roads</p>
              </div>
            </div>

            <div className="mt-4 flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Resolved</span>
              </div>
            </div>
          </GlassCard>

          {/* Priority Override */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-quantum-purple" />
              Priority Override Controls
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">Route A - Highway 101</span>
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">BLOCKED</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Force Open
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Re-route Traffic
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">Shelter B - Priority Upgrade</span>
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">MEDIUM</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Increase Priority
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Simulation Mode */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-quantum-cyan" />
            Simulation Mode - VQE What-If Analysis
          </h3>

          <p className="text-muted-foreground text-sm mb-4">
            Run predictive simulations using Variational Quantum Eigensolver to model disaster scenarios before deploying resources.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium">Flood Spread Model</span>
                <span className="text-xs text-muted-foreground">Predict 24hr expansion</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium">Evacuation Scenario</span>
                <span className="text-xs text-muted-foreground">Test route capacity</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium">Resource Depletion</span>
                <span className="text-xs text-muted-foreground">Supply timeline model</span>
              </div>
            </Button>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
