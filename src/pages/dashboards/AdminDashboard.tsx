import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Cpu, DollarSign, Shield, Users, Settings, 
  Activity, FileText, UserPlus, RefreshCw 
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  user_id: string | null;
}

interface QPUBudget {
  id: string;
  total_shots: number;
  used_shots: number;
  budget_limit: number;
  budget_used: number;
  active_backend: string;
}

export default function AdminDashboard() {
  const [qpuBudget, setQpuBudget] = useState<QPUBudget | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedBackend, setSelectedBackend] = useState('D-Wave');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [budgetRes, logsRes] = await Promise.all([
      supabase.from('qpu_budget').select('*').limit(1).maybeSingle(),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    if (budgetRes.data) {
      setQpuBudget(budgetRes.data);
      setSelectedBackend(budgetRes.data.active_backend || 'D-Wave');
    }
    
    if (logsRes.data) {
      setAuditLogs(logsRes.data);
    }
    
    setLoading(false);
  };

  const updateBackend = async (backend: string) => {
    if (!qpuBudget) return;
    
    const { error } = await supabase
      .from('qpu_budget')
      .update({ active_backend: backend, updated_at: new Date().toISOString() })
      .eq('id', qpuBudget.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update backend', variant: 'destructive' });
    } else {
      setSelectedBackend(backend);
      toast({ title: 'Backend Updated', description: `Switched to ${backend}` });
    }
  };

  const shotsPercentage = qpuBudget 
    ? (qpuBudget.used_shots / qpuBudget.total_shots) * 100 
    : 0;

  const budgetPercentage = qpuBudget 
    ? (Number(qpuBudget.budget_used) / Number(qpuBudget.budget_limit)) * 100 
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Control Center</h1>
            <p className="text-muted-foreground">System & Resource Management</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* QPU Budget Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Quantum Shots Remaining"
            value={qpuBudget ? `${(qpuBudget.total_shots - qpuBudget.used_shots).toLocaleString()}` : '—'}
            icon={Cpu}
            trend={shotsPercentage < 80 ? 'up' : 'down'}
            subValue={`${shotsPercentage.toFixed(1)}% used`}
          />
          <MetricCard
            label="Budget Used"
            value={qpuBudget ? `$${Number(qpuBudget.budget_used).toFixed(2)}` : '—'}
            icon={DollarSign}
            trend={budgetPercentage < 80 ? 'up' : 'down'}
            subValue={`of $${qpuBudget?.budget_limit || 0} limit`}
          />
          <MetricCard
            label="Active Backend"
            value={selectedBackend}
            icon={Settings}
            subValue="Quantum provider"
          />
          <MetricCard
            label="System Status"
            value="Operational"
            icon={Activity}
            trend="up"
            subValue="All systems nominal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QPU Budget Gauge */}
          <GlassCard className="p-6" variant="quantum">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-quantum-cyan" />
              QPU Budget Monitor
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Quantum Shots</span>
                  <span className="text-foreground">
                    {qpuBudget?.used_shots.toLocaleString()} / {qpuBudget?.total_shots.toLocaleString()}
                  </span>
                </div>
                <Progress value={shotsPercentage} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Budget Allocation</span>
                  <span className="text-foreground">
                    ${Number(qpuBudget?.budget_used || 0).toFixed(2)} / ${Number(qpuBudget?.budget_limit || 0).toFixed(2)}
                  </span>
                </div>
                <Progress value={budgetPercentage} className="h-3" />
              </div>
            </div>
          </GlassCard>

          {/* Algorithm Selector */}
          <GlassCard className="p-6" variant="quantum">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-quantum-purple" />
              Algorithm Backend Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Active Quantum Backend</label>
                <Select value={selectedBackend} onValueChange={updateBackend}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D-Wave">D-Wave (Quantum Annealing)</SelectItem>
                    <SelectItem value="Rigetti">Rigetti (Gate-based)</SelectItem>
                    <SelectItem value="IBM-Q">IBM Quantum (Gate-based)</SelectItem>
                    <SelectItem value="IonQ">IonQ (Trapped Ion)</SelectItem>
                    <SelectItem value="Simulator">Classical Simulator (Fallback)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Switching backends may affect optimization quality and cost. 
                  Use Simulator for testing without consuming QPU budget.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Audit Logs */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-quantum-cyan" />
            Audit Logs
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-quantum-cyan" />
                    <div>
                      <p className="text-sm text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.resource_type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* User Provisioning */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-quantum-purple" />
            User Provisioning
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <UserPlus className="w-6 h-6 text-quantum-cyan" />
              <span>Create Operator</span>
              <span className="text-xs text-muted-foreground">Full quantum access</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <UserPlus className="w-6 h-6 text-green-500" />
              <span>Verify Volunteer</span>
              <span className="text-xs text-muted-foreground">Field unit access</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Shield className="w-6 h-6 text-quantum-purple" />
              <span>Review Credentials</span>
              <span className="text-xs text-muted-foreground">Security audit</span>
            </Button>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
