import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Cpu, 
  Save,
  RefreshCw,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  MapPin,
  Wifi,
  WifiOff
} from "lucide-react";

export default function Settings() {
  const { user, role } = useAuth();
  
  // Profile settings
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Appearance settings
  const [darkMode, setDarkMode] = useState(true);
  const [compactView, setCompactView] = useState(false);
  
  // Volunteer settings
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoAcceptTasks, setAutoAcceptTasks] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Admin/Operator settings
  const [budgetLimit, setBudgetLimit] = useState(1000);
  const [totalShots, setTotalShots] = useState(10000);
  const [simulationMode, setSimulationMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [algorithmBackend, setAlgorithmBackend] = useState("simulator");
  
  // User/Civilian settings
  const [shareLocation, setShareLocation] = useState(true);
  const [emergencyContacts, setEmergencyContacts] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setBiometricEnabled(profile.biometric_enabled || false);
    }
    
    // Fetch QPU budget for admin/operator
    if (role === 'admin' || role === 'operator') {
      const { data: budget } = await supabase
        .from('qpu_budget')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (budget) {
        setBudgetLimit(budget.budget_limit);
        setTotalShots(budget.total_shots);
        setAlgorithmBackend(budget.active_backend || "simulator");
      }
    }
  };

  const saveProfileSettings = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
        biometric_enabled: biometricEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error("Failed to save profile settings");
    } else {
      toast.success("Profile settings saved");
      await logAudit('update_profile', { fullName, phone });
    }
    setLoading(false);
  };

  const saveSystemSettings = async () => {
    if (!user || (role !== 'admin' && role !== 'operator')) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('qpu_budget')
      .update({
        budget_limit: budgetLimit,
        total_shots: totalShots,
        active_backend: algorithmBackend,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('qpu_budget').select('id').limit(1).single()).data?.id);
    
    if (error) {
      toast.error("Failed to save system settings");
    } else {
      toast.success("System settings saved");
      await logAudit('update_system_settings', { budgetLimit, totalShots, algorithmBackend, simulationMode, maintenanceMode });
    }
    setLoading(false);
  };

  const resetUsage = async () => {
    if (role !== 'admin') return;
    setLoading(true);
    
    const { error } = await supabase
      .from('qpu_budget')
      .update({
        budget_used: 0,
        used_shots: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('qpu_budget').select('id').limit(1).single()).data?.id);
    
    if (error) {
      toast.error("Failed to reset usage");
    } else {
      toast.success("Usage counters reset");
      await logAudit('reset_usage', {});
    }
    setLoading(false);
  };

  const logAudit = async (action: string, details: Record<string, unknown>) => {
    await supabase.rpc('log_audit', {
      _action: action,
      _resource_type: 'settings',
      _details: details as Json
    });
  };

  const saveNotificationSettings = () => {
    // Store in localStorage for now (could be extended to database)
    localStorage.setItem('notification_settings', JSON.stringify({
      emailNotifications,
      pushNotifications,
      sosAlerts,
      soundEnabled
    }));
    toast.success("Notification settings saved");
  };

  const saveAppearanceSettings = () => {
    localStorage.setItem('appearance_settings', JSON.stringify({
      darkMode,
      compactView
    }));
    document.documentElement.classList.toggle('light', !darkMode);
    toast.success("Appearance settings saved");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Moon className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            {(role === 'volunteer') && (
              <TabsTrigger value="volunteer" className="gap-2">
                <MapPin className="h-4 w-4" />
                Field Settings
              </TabsTrigger>
            )}
            {(role === 'user') && (
              <TabsTrigger value="emergency" className="gap-2">
                <Shield className="h-4 w-4" />
                Emergency
              </TabsTrigger>
            )}
            {(role === 'admin' || role === 'operator') && (
              <TabsTrigger value="system" className="gap-2">
                <Cpu className="h-4 w-4" />
                System
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </h2>
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input 
                    id="avatar" 
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Biometric Login</Label>
                    <p className="text-xs text-muted-foreground">Enable Face ID / fingerprint</p>
                  </div>
                  <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} />
                </div>
                <Button onClick={saveProfileSettings} disabled={loading} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SOS Alerts</Label>
                    <p className="text-xs text-muted-foreground">Emergency distress signals</p>
                  </div>
                  <Switch checked={sosAlerts} onCheckedChange={setSosAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <div>
                      <Label>Sound Effects</Label>
                      <p className="text-xs text-muted-foreground">Alert sounds</p>
                    </div>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
                <Button onClick={saveNotificationSettings} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notifications
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                Appearance
              </h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact View</Label>
                    <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
                  </div>
                  <Switch checked={compactView} onCheckedChange={setCompactView} />
                </div>
                <Button onClick={saveAppearanceSettings} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Volunteer Field Settings */}
          {role === 'volunteer' && (
            <TabsContent value="volunteer">
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Field Operations Settings
                </h2>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {offlineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                      <div>
                        <Label>Offline Mode</Label>
                        <p className="text-xs text-muted-foreground">Cache data for offline use</p>
                      </div>
                    </div>
                    <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Accept Tasks</Label>
                      <p className="text-xs text-muted-foreground">Automatically accept new assignments</p>
                    </div>
                    <Switch checked={autoAcceptTasks} onCheckedChange={setAutoAcceptTasks} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Live Location</Label>
                      <p className="text-xs text-muted-foreground">Allow operators to track your position</p>
                    </div>
                    <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
                  </div>
                  <Button onClick={() => {
                    localStorage.setItem('volunteer_settings', JSON.stringify({ offlineMode, autoAcceptTasks, shareLocation }));
                    toast.success("Field settings saved");
                  }} className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Save Field Settings
                  </Button>
                </div>
              </GlassCard>
            </TabsContent>
          )}

          {/* User Emergency Settings */}
          {role === 'user' && (
            <TabsContent value="emergency">
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Emergency Settings
                </h2>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Location in Emergency</Label>
                      <p className="text-xs text-muted-foreground">Auto-share GPS when SOS is sent</p>
                    </div>
                    <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContacts">Emergency Contacts</Label>
                    <Input 
                      id="emergencyContacts" 
                      value={emergencyContacts} 
                      onChange={(e) => setEmergencyContacts(e.target.value)}
                      placeholder="Phone numbers (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">These contacts will be notified when you send an SOS</p>
                  </div>
                  <Button onClick={() => {
                    localStorage.setItem('emergency_settings', JSON.stringify({ shareLocation, emergencyContacts }));
                    toast.success("Emergency settings saved");
                  }} className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Save Emergency Settings
                  </Button>
                </div>
              </GlassCard>
            </TabsContent>
          )}

          {/* System Settings (Admin/Operator) */}
          {(role === 'admin' || role === 'operator') && (
            <TabsContent value="system">
              <div className="grid gap-6 md:grid-cols-2">
                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    QPU Budget Configuration
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="budgetLimit">Budget Limit ($)</Label>
                      <Input 
                        id="budgetLimit" 
                        type="number" 
                        value={budgetLimit} 
                        onChange={(e) => setBudgetLimit(Number(e.target.value))}
                        disabled={role !== 'admin'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalShots">Total Shots Allocation</Label>
                      <Input 
                        id="totalShots" 
                        type="number" 
                        value={totalShots} 
                        onChange={(e) => setTotalShots(Number(e.target.value))}
                        disabled={role !== 'admin'}
                      />
                    </div>
                    {role === 'admin' && (
                      <Button variant="outline" onClick={resetUsage} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Usage Counters
                      </Button>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Algorithm Backend
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Active Backend</Label>
                      <Select value={algorithmBackend} onValueChange={setAlgorithmBackend} disabled={role !== 'admin'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simulator">Simulator (Local)</SelectItem>
                          <SelectItem value="dwave">D-Wave Advantage</SelectItem>
                          <SelectItem value="rigetti">Rigetti Aspen-M</SelectItem>
                          <SelectItem value="ibmq">IBM-Q Brisbane</SelectItem>
                          <SelectItem value="ionq">IonQ Aria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Simulation Mode</Label>
                        <p className="text-xs text-muted-foreground">Use simulated quantum results</p>
                      </div>
                      <Switch checked={simulationMode} onCheckedChange={setSimulationMode} disabled={role !== 'admin'} />
                    </div>
                    {role === 'admin' && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Maintenance Mode</Label>
                            <p className="text-xs text-muted-foreground text-destructive">Disable all operations</p>
                          </div>
                          <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                        </div>
                      </>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6 md:col-span-2">
                  <Button onClick={saveSystemSettings} disabled={loading || role !== 'admin'} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </Button>
                  {role === 'operator' && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Only administrators can modify system settings
                    </p>
                  )}
                </GlassCard>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
