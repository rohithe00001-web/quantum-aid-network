import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { 
  Cpu, IndianRupee, Shield, Settings, 
  Activity, FileText, RefreshCw, Save, RotateCcw,
  AlertTriangle
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
  
  // Editable settings
  const [editBudgetLimit, setEditBudgetLimit] = useState('');
  const [editTotalShots, setEditTotalShots] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (qpuBudget) {
      setEditBudgetLimit(String(qpuBudget.budget_limit));
      setEditTotalShots(String(qpuBudget.total_shots));
    }
  }, [qpuBudget]);

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
      
      await supabase.rpc('log_audit', {
        _action: 'backend_change',
        _resource_type: 'qpu_budget',
        _resource_id: qpuBudget.id,
        _details: { new_backend: backend }
      });
      fetchData();
    }
  };

  const saveBudgetSettings = async () => {
    if (!qpuBudget) return;
    setSaving(true);

    const budgetLimit = parseFloat(editBudgetLimit);
    const totalShots = parseInt(editTotalShots);

    if (isNaN(budgetLimit) || budgetLimit <= 0) {
      toast({ title: 'Invalid Budget', description: 'Please enter a valid budget limit', variant: 'destructive' });
      setSaving(false);
      return;
    }

    if (isNaN(totalShots) || totalShots <= 0) {
      toast({ title: 'Invalid Shots', description: 'Please enter a valid total shots', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('qpu_budget')
      .update({ 
        budget_limit: budgetLimit, 
        total_shots: totalShots,
        updated_at: new Date().toISOString() 
      })
      .eq('id', qpuBudget.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } else {
      toast({ title: 'Settings Saved', description: 'Budget configuration updated successfully' });
      
      await supabase.rpc('log_audit', {
        _action: 'budget_update',
        _resource_type: 'qpu_budget',
        _resource_id: qpuBudget.id,
        _details: { budget_limit: budgetLimit, total_shots: totalShots }
      });
      fetchData();
    }
    
    setSaving(false);
  };

  const resetUsage = async () => {
    if (!qpuBudget) return;
    
    const confirmed = window.confirm('Are you sure you want to reset all QPU usage counters? This action cannot be undone.');
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from('qpu_budget')
      .update({ 
        used_shots: 0, 
        budget_used: 0,
        updated_at: new Date().toISOString() 
      })
      .eq('id', qpuBudget.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to reset usage', variant: 'destructive' });
    } else {
      toast({ title: 'Usage Reset', description: 'All QPU usage counters have been reset' });
      
      await supabase.rpc('log_audit', {
        _action: 'usage_reset',
        _resource_type: 'qpu_budget',
        _resource_id: qpuBudget.id,
        _details: { reset_at: new Date().toISOString() }
      });
      fetchData();
    }
    
    setSaving(false);
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
            value={qpuBudget ? `₹${Number(qpuBudget.budget_used).toFixed(2)}` : '—'}
            icon={IndianRupee}
            trend={budgetPercentage < 80 ? 'up' : 'down'}
            subValue={`of ₹${qpuBudget?.budget_limit || 0} limit`}
          />
          <MetricCard
            label="Active Backend"
            value={selectedBackend}
            icon={Settings}
            subValue="Quantum provider"
          />
          <MetricCard
            label="System Status"
            value={maintenanceMode ? 'Maintenance' : 'Operational'}
            icon={maintenanceMode ? AlertTriangle : Activity}
            trend={maintenanceMode ? 'down' : 'up'}
            subValue={maintenanceMode ? 'Limited access' : 'All systems nominal'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QPU Budget Configuration */}
          <GlassCard className="p-6" variant="quantum">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-quantum-cyan" />
              QPU Budget Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetLimit" className="text-sm text-muted-foreground">Budget Limit (₹)</Label>
                  <Input
                    id="budgetLimit"
                    type="number"
                    value={editBudgetLimit}
                    onChange={(e) => setEditBudgetLimit(e.target.value)}
                    className="mt-1 bg-secondary/50"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <Label htmlFor="totalShots" className="text-sm text-muted-foreground">Total Quantum Shots</Label>
                  <Input
                    id="totalShots"
                    type="number"
                    value={editTotalShots}
                    onChange={(e) => setEditTotalShots(e.target.value)}
                    className="mt-1 bg-secondary/50"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Shots Usage</span>
                  <span className="text-foreground">
                    {qpuBudget?.used_shots.toLocaleString()} / {qpuBudget?.total_shots.toLocaleString()}
                  </span>
                </div>
                <Progress value={shotsPercentage} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Budget Usage</span>
                  <span className="text-foreground">
                    ₹{Number(qpuBudget?.budget_used || 0).toFixed(2)} / ₹{Number(qpuBudget?.budget_limit || 0).toFixed(2)}
                  </span>
                </div>
                <Progress value={budgetPercentage} className="h-3" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveBudgetSettings} disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
                <Button onClick={resetUsage} variant="outline" disabled={saving}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Usage
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Algorithm Backend & System Settings */}
          <GlassCard className="p-6" variant="quantum">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-quantum-purple" />
              System Configuration
            </h3>

            <div className="space-y-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Active Quantum Backend</Label>
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

              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance" className="text-sm font-medium">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Restrict system access to admins only</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>
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

        {/* User Role Management */}
        <UserRoleManager />
      </div>
    </Layout>
  );
}