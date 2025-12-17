import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, Plus, Edit2, Trash2, MapPin, 
  Fuel, Package, RefreshCw, X, Check
} from 'lucide-react';

interface FleetVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
  current_location: { lat: number; lng: number } | null;
  capacity: number;
  fuel_level: number;
  assigned_volunteer_id: string | null;
  created_at: string;
}

interface FleetManagerProps {
  compact?: boolean;
}

export function FleetManager({ compact = false }: FleetManagerProps) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'truck',
    status: 'available',
    capacity: 100,
    fuel_level: 100
  });

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('fleet_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, () => {
        fetchVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
    } else if (data) {
      const mappedVehicles: FleetVehicle[] = data.map((v) => ({
        id: v.id,
        vehicle_number: v.vehicle_number,
        vehicle_type: v.vehicle_type,
        status: v.status,
        current_location: v.current_location as { lat: number; lng: number } | null,
        capacity: v.capacity ?? 100,
        fuel_level: v.fuel_level ?? 100,
        assigned_volunteer_id: v.assigned_volunteer_id,
        created_at: v.created_at
      }));
      setVehicles(mappedVehicles);
    }
    setLoading(false);
  };

  const addVehicle = async () => {
    if (!formData.vehicle_number.trim()) {
      toast({ title: 'Error', description: 'Vehicle number is required', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('fleet_vehicles').insert({
      vehicle_number: formData.vehicle_number,
      vehicle_type: formData.vehicle_type,
      status: formData.status,
      capacity: formData.capacity,
      fuel_level: formData.fuel_level,
      current_location: { lat: 28.6139 + (Math.random() - 0.5) * 2, lng: 77.2090 + (Math.random() - 0.5) * 2 }
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add vehicle', variant: 'destructive' });
    } else {
      toast({ title: 'Vehicle Added', description: `${formData.vehicle_number} added to fleet` });
      resetForm();
      fetchVehicles();
    }
  };

  const updateVehicle = async (id: string) => {
    const { error } = await supabase
      .from('fleet_vehicles')
      .update({
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        status: formData.status,
        capacity: formData.capacity,
        fuel_level: formData.fuel_level
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update vehicle', variant: 'destructive' });
    } else {
      toast({ title: 'Vehicle Updated', description: 'Vehicle details saved' });
      resetForm();
      setEditingId(null);
      fetchVehicles();
    }
  };

  const deleteVehicle = async (id: string, vehicleNumber: string) => {
    const confirmed = window.confirm(`Delete vehicle ${vehicleNumber}?`);
    if (!confirmed) return;

    const { error } = await supabase.from('fleet_vehicles').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete vehicle', variant: 'destructive' });
    } else {
      toast({ title: 'Vehicle Deleted', description: `${vehicleNumber} removed from fleet` });
      fetchVehicles();
    }
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('fleet_vehicles')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchVehicles();
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: 'truck',
      status: 'available',
      capacity: 100,
      fuel_level: 100
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (vehicle: FleetVehicle) => {
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      status: vehicle.status,
      capacity: vehicle.capacity,
      fuel_level: vehicle.fuel_level
    });
    setEditingId(vehicle.id);
    setShowAddForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_use': return 'bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/30';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'unavailable': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck': return '🚛';
      case 'ambulance': return '🚑';
      case 'van': return '🚐';
      case 'motorcycle': return '🏍️';
      default: return '🚗';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Truck className="w-5 h-5 text-quantum-cyan" />
          Fleet Vehicles
          <span className="text-sm text-muted-foreground">({vehicles.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={fetchVehicles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-secondary/30 rounded-lg border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">
              {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h4>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
              <Input
                value={formData.vehicle_number}
                onChange={(e) => setFormData(f => ({ ...f, vehicle_number: e.target.value }))}
                placeholder="e.g., MH-01-AB-1234"
                className="mt-1 bg-secondary/50"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(v) => setFormData(f => ({ ...f, vehicle_type: v }))}
              >
                <SelectTrigger className="mt-1 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}
              >
                <SelectTrigger className="mt-1 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Capacity (%)</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
                className="mt-1 bg-secondary/50"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Fuel Level (%)</Label>
              <Input
                type="number"
                value={formData.fuel_level}
                onChange={(e) => setFormData(f => ({ ...f, fuel_level: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
                className="mt-1 bg-secondary/50"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => editingId ? updateVehicle(editingId) : addVehicle()}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-1" />
                {editingId ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className={`space-y-2 ${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No vehicles in fleet</p>
            <p className="text-xs">Add vehicles to get started</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className="p-3 bg-secondary/30 rounded-lg border border-border/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getVehicleIcon(vehicle.vehicle_type)}</span>
                  <div>
                    <p className="font-medium text-foreground">{vehicle.vehicle_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">{vehicle.vehicle_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.replace('_', ' ')}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(vehicle)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteVehicle(vehicle.id, vehicle.vehicle_number)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vehicle Stats */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Fuel className="w-3 h-3 text-yellow-400" />
                  <Progress value={vehicle.fuel_level} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{vehicle.fuel_level}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-quantum-cyan" />
                  <Progress value={vehicle.capacity} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{vehicle.capacity}%</span>
                </div>
              </div>

              {vehicle.current_location && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {vehicle.current_location.lat.toFixed(4)}, {vehicle.current_location.lng.toFixed(4)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}