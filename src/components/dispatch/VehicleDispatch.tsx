import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Truck, Building2, Send, CheckCircle, Clock, 
  X, RefreshCw, MapPin, ArrowRight 
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
  assigned_shelter_id: string | null;
}

interface Shelter {
  id: string;
  name: string;
  status: string;
  current_occupancy: number;
  capacity: number;
}

interface Dispatch {
  id: string;
  vehicle_id: string;
  shelter_id: string;
  dispatch_type: string;
  status: string;
  dispatched_at: string;
  completed_at: string | null;
  notes: string | null;
  vehicle?: Vehicle;
  shelter?: Shelter;
}

export function VehicleDispatch() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedShelter, setSelectedShelter] = useState<string>('');
  const [dispatchType, setDispatchType] = useState<string>('supply_run');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dispatch-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_dispatches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [vehicleRes, shelterRes, dispatchRes] = await Promise.all([
      supabase.from('fleet_vehicles').select('id, vehicle_number, vehicle_type, status, assigned_shelter_id'),
      supabase.from('shelters').select('id, name, status, current_occupancy, capacity'),
      supabase.from('vehicle_dispatches').select('*').eq('status', 'dispatched').order('dispatched_at', { ascending: false })
    ]);

    if (vehicleRes.data) setVehicles(vehicleRes.data);
    if (shelterRes.data) setShelters(shelterRes.data);
    if (dispatchRes.data) {
      // Enrich dispatches with vehicle and shelter info
      const enriched = dispatchRes.data.map(d => ({
        ...d,
        vehicle: vehicleRes.data?.find(v => v.id === d.vehicle_id),
        shelter: shelterRes.data?.find(s => s.id === d.shelter_id)
      }));
      setDispatches(enriched);
    }

    setLoading(false);
  };

  const dispatchVehicle = async () => {
    if (!selectedVehicle || !selectedShelter) {
      toast.error('Please select both vehicle and shelter');
      return;
    }

    // Create dispatch record
    const { error: dispatchError } = await supabase.from('vehicle_dispatches').insert({
      vehicle_id: selectedVehicle,
      shelter_id: selectedShelter,
      dispatch_type: dispatchType,
      status: 'dispatched'
    });

    if (dispatchError) {
      toast.error('Failed to create dispatch');
      return;
    }

    // Update vehicle status and assignment
    const { error: vehicleError } = await supabase
      .from('fleet_vehicles')
      .update({ 
        status: 'in_use',
        assigned_shelter_id: selectedShelter 
      })
      .eq('id', selectedVehicle);

    if (vehicleError) {
      toast.error('Failed to update vehicle status');
      return;
    }

    toast.success('Vehicle dispatched successfully');
    setDialogOpen(false);
    setSelectedVehicle('');
    setSelectedShelter('');
    fetchData();
  };

  const completeDispatch = async (dispatchId: string, vehicleId: string) => {
    // Update dispatch status
    await supabase
      .from('vehicle_dispatches')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', dispatchId);

    // Update vehicle status
    await supabase
      .from('fleet_vehicles')
      .update({ status: 'available', assigned_shelter_id: null })
      .eq('id', vehicleId);

    toast.success('Dispatch completed');
    fetchData();
  };

  const cancelDispatch = async (dispatchId: string, vehicleId: string) => {
    await supabase.from('vehicle_dispatches').delete().eq('id', dispatchId);
    await supabase
      .from('fleet_vehicles')
      .update({ status: 'available', assigned_shelter_id: null })
      .eq('id', vehicleId);

    toast.success('Dispatch cancelled');
    fetchData();
  };

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const openShelters = shelters.filter(s => s.status === 'open');

  const getDispatchTypeLabel = (type: string) => {
    switch (type) {
      case 'supply_run': return 'Supply Run';
      case 'evacuation': return 'Evacuation';
      case 'medical': return 'Medical Support';
      case 'rescue': return 'Rescue Mission';
      default: return type;
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Send className="w-5 h-5 text-quantum-cyan" />
          Vehicle Dispatch Center
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={availableVehicles.length === 0 || openShelters.length === 0}>
                <Truck className="w-4 h-4 mr-1" />
                Dispatch Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispatch Vehicle to Shelter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Vehicle</label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vehicle_number} ({v.vehicle_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Shelter</label>
                  <Select value={selectedShelter} onValueChange={setSelectedShelter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a shelter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {openShelters.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.current_occupancy}/{s.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Dispatch Type</label>
                  <Select value={dispatchType} onValueChange={setDispatchType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supply_run">Supply Run</SelectItem>
                      <SelectItem value="evacuation">Evacuation</SelectItem>
                      <SelectItem value="medical">Medical Support</SelectItem>
                      <SelectItem value="rescue">Rescue Mission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={dispatchVehicle} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Dispatch Now
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Dispatches */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {dispatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No active dispatches</p>
            <p className="text-xs">Dispatch a vehicle to a shelter to get started</p>
          </div>
        ) : (
          dispatches.map(dispatch => (
            <div key={dispatch.id} className="p-4 bg-secondary/30 rounded-lg border border-quantum-cyan/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-quantum-cyan" />
                  <span className="font-medium">{dispatch.vehicle?.vehicle_number || 'Unknown'}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">{dispatch.shelter?.name || 'Unknown'}</span>
                </div>
                <Badge variant="outline" className="bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/30">
                  <Clock className="w-3 h-3 mr-1" />
                  In Progress
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{getDispatchTypeLabel(dispatch.dispatch_type)}</span>
                  <span>•</span>
                  <span>{new Date(dispatch.dispatched_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    onClick={() => completeDispatch(dispatch.id, dispatch.vehicle_id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-red-400 hover:bg-red-500/20"
                    onClick={() => cancelDispatch(dispatch.id, dispatch.vehicle_id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-quantum-cyan">{availableVehicles.length}</p>
          <p className="text-xs text-muted-foreground">Available Vehicles</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-400">{openShelters.length}</p>
          <p className="text-xs text-muted-foreground">Open Shelters</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-400">{dispatches.length}</p>
          <p className="text-xs text-muted-foreground">Active Dispatches</p>
        </div>
      </div>
    </GlassCard>
  );
}
