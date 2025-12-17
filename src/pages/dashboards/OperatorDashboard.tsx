import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { QuantumLoader } from '@/components/ui/QuantumLoader';
import { OperationsMap } from '@/components/map/OperationsMap';
import { FleetManager } from '@/components/fleet/FleetManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Play, Sliders, 
  Truck, Users, AlertTriangle, Zap,
  BarChart3, RefreshCw, ArrowUp, ArrowDown, Map
} from 'lucide-react';

interface SOSRequest {
  id: string;
  status: string;
  location: { lat: number; lng: number };
  created_at: string;
}

interface RouteOverride {
  id: string;
  name: string;
  status: 'blocked' | 'open' | 'congested';
  priority: 'high' | 'medium' | 'low';
}

interface VolunteerLocation {
  id: string;
  volunteer_id: string;
  current_location: { lat: number; lng: number } | null;
  status: string;
}

interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  type: 'vehicle' | 'shelter' | 'alert' | 'resource';
  label: string;
}

interface FleetVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
  current_location: { lat: number; lng: number } | null;
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationType, setOptimizationType] = useState<string | null>(null);
  const [priorityOverrideEnabled, setPriorityOverrideEnabled] = useState(false);
  const [stats, setStats] = useState({
    activeVehicles: 0,
    pendingSOS: 0,
    sheltersActive: 0,
    resourcesDeployed: 0
  });
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [volunteerLocations, setVolunteerLocations] = useState<VolunteerLocation[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [mapboxToken, setMapboxToken] = useState(() => localStorage.getItem('mapbox_token') || '');
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [routes, setRoutes] = useState<RouteOverride[]>([
    { id: '1', name: 'Highway 101 - North', status: 'blocked', priority: 'high' },
    { id: '2', name: 'Main Street Bridge', status: 'congested', priority: 'medium' },
    { id: '3', name: 'Downtown Corridor', status: 'open', priority: 'low' }
  ]);

  useEffect(() => {
    fetchStats();
    fetchSOSRequests();
    fetchVolunteerLocations();
    fetchFleetVehicles();

    // Subscribe to real-time SOS updates
    const sosChannel = supabase
      .channel('sos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, () => {
        fetchSOSRequests();
        fetchStats();
      })
      .subscribe();

    // Subscribe to real-time volunteer location updates
    const volunteerChannel = supabase
      .channel('volunteer_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_assignments' }, () => {
        fetchVolunteerLocations();
        fetchStats();
      })
      .subscribe();

    // Subscribe to real-time fleet vehicle updates
    const fleetChannel = supabase
      .channel('fleet_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, () => {
        fetchFleetVehicles();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sosChannel);
      supabase.removeChannel(volunteerChannel);
      supabase.removeChannel(fleetChannel);
    };
  }, []);

  const fetchStats = async () => {
    // Fetch pending SOS count
    const { count: sosCount } = await supabase
      .from('sos_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Fetch active volunteers
    const { count: volunteerCount } = await supabase
      .from('volunteer_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'en_route');

    // Fetch resource requests
    const { count: resourceCount } = await supabase
      .from('resource_requests')
      .select('*', { count: 'exact', head: true });

    setStats({
      activeVehicles: volunteerCount || 0,
      pendingSOS: sosCount || 0,
      sheltersActive: 8, // Static for now
      resourcesDeployed: resourceCount || 0
    });
  };

  const fetchSOSRequests = async () => {
    const { data } = await supabase
      .from('sos_requests')
      .select('id, status, location, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setSosRequests(data as SOSRequest[]);
    }
  };

  const fetchVolunteerLocations = async () => {
    const { data } = await supabase
      .from('volunteer_assignments')
      .select('id, volunteer_id, current_location, status')
      .in('status', ['en_route', 'idle']);

    if (data) {
      setVolunteerLocations(data as VolunteerLocation[]);
    }
  };

  const fetchFleetVehicles = async () => {
    const { data } = await supabase
      .from('fleet_vehicles')
      .select('id, vehicle_number, vehicle_type, status, current_location')
      .in('status', ['available', 'in_use']);

    if (data) {
      const mapped = data.map((v) => ({
        id: v.id,
        vehicle_number: v.vehicle_number,
        vehicle_type: v.vehicle_type,
        status: v.status,
        current_location: v.current_location as { lat: number; lng: number } | null
      }));
      setFleetVehicles(mapped);
    }
  };

  // Build map markers from SOS requests, volunteer locations, and fleet vehicles
  useEffect(() => {
    const markers: MapMarker[] = [];

    // Add SOS markers
    sosRequests.forEach((sos) => {
      const loc = sos.location as { lat: number; lng: number };
      if (loc?.lat && loc?.lng) {
        markers.push({
          id: `sos-${sos.id}`,
          lat: loc.lat,
          lng: loc.lng,
          type: 'alert',
          label: `SOS #${sos.id.slice(0, 6)}`
        });
      }
    });

    // Add volunteer markers
    volunteerLocations.forEach((vol) => {
      const loc = vol.current_location;
      if (loc?.lat && loc?.lng) {
        markers.push({
          id: `vol-${vol.id}`,
          lat: loc.lat,
          lng: loc.lng,
          type: 'resource',
          label: `Volunteer ${vol.status === 'en_route' ? '(En Route)' : '(Idle)'}`
        });
      }
    });

    // Add fleet vehicle markers
    fleetVehicles.forEach((vehicle) => {
      const loc = vehicle.current_location;
      if (loc?.lat && loc?.lng) {
        markers.push({
          id: `fleet-${vehicle.id}`,
          lat: loc.lat,
          lng: loc.lng,
          type: 'vehicle',
          label: `${vehicle.vehicle_number} (${vehicle.vehicle_type})`
        });
      }
    });

    setMapMarkers(markers);
  }, [sosRequests, volunteerLocations, fleetVehicles]);

  const saveMapboxToken = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
    toast({ title: 'Token Saved', description: 'Mapbox token stored successfully' });
  };

  const executeQuantumOptimization = async (type: string, algorithm: string) => {
    if (!user) return;

    setIsOptimizing(true);
    setOptimizationType(type);

    try {
      const { error } = await supabase.from('quantum_operations').insert({
        operator_id: user.id,
        operation_type: type,
        algorithm: algorithm,
        status: 'running',
        parameters: { initiated_at: new Date().toISOString() },
        priority_override: priorityOverrideEnabled
      });

      if (error) throw error;

      // Simulate quantum processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update operation status
      await supabase.from('quantum_operations')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('operator_id', user.id)
        .eq('operation_type', type)
        .eq('status', 'running');

      toast({
        title: 'Optimization Complete',
        description: `${type} optimization finished using ${algorithm}`
      });

      fetchStats();
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

  const updateRouteStatus = (routeId: string, newStatus: 'blocked' | 'open' | 'congested') => {
    setRoutes(routes.map(r => r.id === routeId ? { ...r, status: newStatus } : r));
    toast({
      title: 'Route Updated',
      description: `Route status changed to ${newStatus}`
    });
  };

  const updateRoutePriority = (routeId: string, direction: 'up' | 'down') => {
    const priorities: ('high' | 'medium' | 'low')[] = ['low', 'medium', 'high'];
    setRoutes(routes.map(r => {
      if (r.id === routeId) {
        const currentIndex = priorities.indexOf(r.priority);
        const newIndex = direction === 'up' 
          ? Math.min(currentIndex + 1, 2)
          : Math.max(currentIndex - 1, 0);
        return { ...r, priority: priorities[newIndex] };
      }
      return r;
    }));
    toast({
      title: 'Priority Updated',
      description: `Route priority ${direction === 'up' ? 'increased' : 'decreased'}`
    });
  };

  const assignVolunteerToSOS = async (sosId: string) => {
    try {
      // Find an idle volunteer
      const { data: volunteer } = await supabase
        .from('volunteer_assignments')
        .select('volunteer_id')
        .eq('status', 'idle')
        .limit(1)
        .maybeSingle();

      if (volunteer) {
        await supabase.from('sos_requests')
          .update({ 
            assigned_volunteer_id: volunteer.volunteer_id,
            eta_minutes: Math.floor(Math.random() * 20) + 5
          })
          .eq('id', sosId);

        toast({
          title: 'Volunteer Assigned',
          description: 'A volunteer has been dispatched to this location'
        });
        fetchSOSRequests();
      } else {
        toast({
          title: 'No Volunteers Available',
          description: 'All volunteers are currently busy',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: 'Could not assign volunteer',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'bg-red-500/20 text-red-400';
      case 'congested': return 'bg-yellow-500/20 text-yellow-400';
      case 'open': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={priorityOverrideEnabled}
                onCheckedChange={setPriorityOverrideEnabled}
              />
              <Label className="text-sm text-muted-foreground">Priority Override</Label>
            </div>
            <span className="px-3 py-1 text-xs bg-quantum-cyan/20 text-quantum-cyan rounded-full border border-quantum-cyan/30">
              COMMANDER ACCESS
            </span>
          </div>
        </div>

        {/* Real-time Operations Map */}
        <GlassCard className="p-4" variant="quantum">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Map className="w-5 h-5 text-quantum-cyan" />
              Real-time Operations Map
            </h3>
            {!mapboxToken && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter Mapbox token..."
                  className="w-64 bg-secondary/50 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveMapboxToken((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    if (input?.value) saveMapboxToken(input.value);
                  }}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          <div className="h-80 rounded-lg overflow-hidden border border-border/30">
            <OperationsMap mapboxToken={mapboxToken} markers={mapMarkers} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" /> SOS Alerts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#00d9ff]" /> Fleet Vehicles
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#a855f7]" /> Volunteers
            </span>
          </div>
        </GlassCard>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Volunteers"
            value={stats.activeVehicles}
            icon={Truck}
            trend="up"
            subValue="Currently en route"
          />
          <MetricCard
            label="Pending SOS"
            value={stats.pendingSOS}
            icon={AlertTriangle}
            trend={stats.pendingSOS > 5 ? "up" : "down"}
            subValue="Awaiting response"
            variant={stats.pendingSOS > 10 ? "warning" : "default"}
          />
          <MetricCard
            label="Shelters Active"
            value={stats.sheltersActive}
            icon={Users}
            trend="up"
            subValue="Receiving victims"
          />
          <MetricCard
            label="Resource Requests"
            value={stats.resourcesDeployed}
            icon={BarChart3}
            trend="up"
            subValue="Total requests"
          />
        </div>

        {/* Execute Quantum Optimization */}
        <GlassCard className="p-6" variant="quantum">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            Execute Quantum Optimization
            {priorityOverrideEnabled && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                PRIORITY OVERRIDE ACTIVE
              </span>
            )}
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
          {/* Real-time SOS Alerts */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Real-time SOS Alerts
              <Button size="sm" variant="ghost" onClick={fetchSOSRequests} className="ml-auto">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </h3>

            {sosRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending SOS requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sosRequests.map((sos) => (
                  <div key={sos.id} className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground font-medium">
                        SOS #{sos.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sos.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Location: {(sos.location as any)?.lat?.toFixed(4)}, {(sos.location as any)?.lng?.toFixed(4)}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full bg-quantum-cyan/20 hover:bg-quantum-cyan/30 text-quantum-cyan"
                      onClick={() => assignVolunteerToSOS(sos.id)}
                    >
                      Assign Volunteer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Priority Override Controls */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-quantum-purple" />
              Priority Override Controls
            </h3>

            <div className="space-y-3">
              {routes.map((route) => (
                <div key={route.id} className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{route.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(route.status)}`}>
                        {route.status.toUpperCase()}
                      </span>
                      <span className={`text-xs ${getPriorityColor(route.priority)}`}>
                        {route.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {route.status === 'blocked' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => updateRouteStatus(route.id, 'open')}
                      >
                        Force Open
                      </Button>
                    )}
                    {route.status === 'open' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => updateRouteStatus(route.id, 'blocked')}
                      >
                        Mark Blocked
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => updateRoutePriority(route.id, 'up')}
                      disabled={route.priority === 'high'}
                    >
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Priority
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => updateRoutePriority(route.id, 'down')}
                      disabled={route.priority === 'low'}
                    >
                      <ArrowDown className="w-3 h-3 mr-1" />
                      Priority
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Fleet Management */}
        <FleetManager />

      </div>
    </Layout>
  );
}
