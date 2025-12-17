import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { QuantumLoader } from '@/components/ui/QuantumLoader';
import { 
  AlertCircle, Clock, MapPin, Droplets, 
  Pill, Baby, Package, CheckCircle,
  XCircle, RefreshCw, Phone, Route, 
  Boxes, TrafficCone, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResourceNeeds {
  water: boolean;
  food: boolean;
  medicine: boolean;
  insulin: boolean;
  babyFormula: boolean;
  other: string;
}

interface SOSRequest {
  id: string;
  status: string;
  eta_minutes: number | null;
  assigned_volunteer_id: string | null;
  created_at: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sosStatus, setSosStatus] = useState<'none' | 'pending' | 'help_coming' | 'resolved'>('none');
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSOS, setCurrentSOS] = useState<SOSRequest | null>(null);
  const [resources, setResources] = useState<ResourceNeeds>({
    water: false,
    food: false,
    medicine: false,
    insulin: false,
    babyFormula: false,
    other: ''
  });
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      checkExistingSOS();
      fetchProfile();

      // Subscribe to SOS updates
      const channel = supabase
        .channel('user_sos_updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sos_requests',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newData = payload.new as SOSRequest;
          setCurrentSOS(newData);
          if (newData.eta_minutes) {
            setEtaMinutes(newData.eta_minutes);
            setSosStatus('help_coming');
          }
          if (newData.status === 'resolved') {
            setSosStatus('resolved');
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setUserProfile(data);
    }
  };

  const checkExistingSOS = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('sos_requests')
      .select('id, status, eta_minutes, assigned_volunteer_id, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCurrentSOS(data);
      if (data.eta_minutes) {
        setEtaMinutes(data.eta_minutes);
        setSosStatus('help_coming');
      } else {
        setSosStatus('pending');
      }
    }
  };

  const sendSOS = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Get current location
      let location = { lat: 37.0902, lng: -95.7129 }; // Default
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) {
          console.log('Using default location');
        }
      }

      // Create SOS request
      const { data: sosData, error: sosError } = await supabase
        .from('sos_requests')
        .insert({
          user_id: user.id,
          location,
          status: 'pending'
        })
        .select()
        .single();

      if (sosError) throw sosError;

      // Create resource request if any selected
      if (resources.water || resources.food || resources.medicine || 
          resources.insulin || resources.babyFormula || resources.other) {
        await supabase.from('resource_requests').insert({
          user_id: user.id,
          sos_request_id: sosData.id,
          needs_water: resources.water,
          needs_food: resources.food,
          needs_medicine: resources.medicine,
          needs_insulin: resources.insulin,
          needs_baby_formula: resources.babyFormula,
          other_needs: resources.other || null,
          priority_level: resources.insulin || resources.medicine ? 3 : 1
        });
      }

      setCurrentSOS(sosData);
      setSosStatus('pending');

      toast({
        title: 'SOS Sent!',
        description: 'Your location has been logged. Help is being dispatched.'
      });
    } catch (error) {
      toast({
        title: 'Failed to Send SOS',
        description: 'Please try again or call emergency services directly.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSOS = async () => {
    if (!user || !currentSOS) return;

    try {
      await supabase
        .from('sos_requests')
        .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
        .eq('id', currentSOS.id);

      setSosStatus('none');
      setCurrentSOS(null);
      setEtaMinutes(null);
      setResources({
        water: false,
        food: false,
        medicine: false,
        insulin: false,
        babyFormula: false,
        other: ''
      });

      toast({
        title: 'SOS Cancelled',
        description: 'Your request has been cancelled.'
      });
    } catch (error) {
      toast({
        title: 'Cancel Failed',
        description: 'Could not cancel SOS request',
        variant: 'destructive'
      });
    }
  };

  const markResolved = async () => {
    if (!user || !currentSOS) return;

    try {
      await supabase
        .from('sos_requests')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', currentSOS.id);

      setSosStatus('none');
      setCurrentSOS(null);
      setEtaMinutes(null);

      toast({
        title: 'Marked as Resolved',
        description: 'Thank you! Stay safe.'
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update status',
        variant: 'destructive'
      });
    }
  };

  const updateProfile = async (field: string, value: string) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      fetchProfile();
      toast({
        title: 'Profile Updated',
        description: `Your ${field.replace('_', ' ')} has been updated.`
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update profile',
        variant: 'destructive'
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">Emergency Assistance</h1>
          <p className="text-muted-foreground">Civilian Portal</p>
          {userProfile?.full_name && (
            <p className="text-sm text-quantum-cyan mt-1">Welcome, {userProfile.full_name}</p>
          )}
        </div>

        {/* One-Click SOS */}
        <GlassCard className="p-8" variant="quantum">
          {sosStatus === 'none' && (
            <div className="text-center">
              <Button
                onClick={sendSOS}
                disabled={isSubmitting}
                className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
              >
                {isSubmitting ? (
                  <QuantumLoader size="lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-12 h-12" />
                    <span>SOS</span>
                  </div>
                )}
              </Button>
              <p className="mt-4 text-muted-foreground text-sm">
                Press to send your location and request help
              </p>
            </div>
          )}

          {sosStatus === 'pending' && !etaMinutes && (
            <div className="text-center py-8">
              <QuantumLoader size="lg" />
              <p className="mt-4 text-quantum-cyan animate-pulse">
                Processing your request...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Quantum routing algorithm calculating optimal response
              </p>
              <Button
                variant="outline"
                onClick={cancelSOS}
                className="mt-4 text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel SOS
              </Button>
            </div>
          )}

          {sosStatus === 'help_coming' && etaMinutes && (
            <div className="text-center py-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Help is on the way!</h3>
              <div className="flex items-center justify-center gap-2 text-quantum-cyan">
                <Clock className="w-5 h-5" />
                <span className="text-3xl font-bold">{etaMinutes}</span>
                <span className="text-lg">minutes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Estimated arrival time (calculated by quantum routing)
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={markResolved}
                  className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Help Arrived
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelSOS}
                  className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Resource Request Form */}
        {sosStatus === 'none' && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-quantum-cyan" />
              Resource Request
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Select what supplies you need (optional - helps prioritize response)
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={resources.water}
                  onCheckedChange={(checked) => setResources(r => ({ ...r, water: !!checked }))}
                />
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-foreground">Water</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={resources.food}
                  onCheckedChange={(checked) => setResources(r => ({ ...r, food: !!checked }))}
                />
                <Package className="w-5 h-5 text-orange-400" />
                <span className="text-foreground">Food</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={resources.medicine}
                  onCheckedChange={(checked) => setResources(r => ({ ...r, medicine: !!checked }))}
                />
                <Pill className="w-5 h-5 text-green-400" />
                <span className="text-foreground">Medicine</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors border border-red-500/30">
                <Checkbox
                  checked={resources.insulin}
                  onCheckedChange={(checked) => setResources(r => ({ ...r, insulin: !!checked }))}
                />
                <Pill className="w-5 h-5 text-red-400" />
                <span className="text-foreground">Insulin</span>
                <span className="text-xs text-red-400 ml-auto">CRITICAL</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors col-span-2">
                <Checkbox
                  checked={resources.babyFormula}
                  onCheckedChange={(checked) => setResources(r => ({ ...r, babyFormula: !!checked }))}
                />
                <Baby className="w-5 h-5 text-pink-400" />
                <span className="text-foreground">Baby Formula</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other" className="text-muted-foreground">Other needs</Label>
              <Textarea
                id="other"
                value={resources.other}
                onChange={(e) => setResources(r => ({ ...r, other: e.target.value }))}
                placeholder="Describe any other needs..."
                className="bg-secondary/50 border-border/50"
                rows={2}
              />
            </div>
          </GlassCard>
        )}

        {/* Status Tracker */}
        {sosStatus !== 'none' && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-quantum-cyan" />
              Status Tracker
              <Button size="sm" variant="ghost" onClick={checkExistingSOS} className="ml-auto">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-foreground font-medium">SOS Received</p>
                  <p className="text-xs text-muted-foreground">Your location has been logged</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                etaMinutes ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                {etaMinutes ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
                )}
                <div>
                  <p className="text-foreground font-medium">Route Calculated</p>
                  <p className="text-xs text-muted-foreground">
                    {etaMinutes ? 'Volunteer assigned and en route' : 'Quantum algorithm processing...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/30 opacity-50">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                <div>
                  <p className="text-foreground font-medium">Help Arrived</p>
                  <p className="text-xs text-muted-foreground">Waiting for volunteer arrival</p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Quick Links to Optimization Pages */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            Disaster Response Status
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            View real-time quantum-optimized operations
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-quantum-cyan/10 hover:border-quantum-cyan/50"
              onClick={() => navigate('/fleet-routing')}
            >
              <Route className="w-6 h-6 text-blue-400" />
              <span className="text-sm font-medium">Fleet Routing</span>
              <span className="text-xs text-muted-foreground">Vehicle dispatch</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-quantum-cyan/10 hover:border-quantum-cyan/50"
              onClick={() => navigate('/resource-allocation')}
            >
              <Boxes className="w-6 h-6 text-green-400" />
              <span className="text-sm font-medium">Resources</span>
              <span className="text-xs text-muted-foreground">Supply distribution</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-quantum-cyan/10 hover:border-quantum-cyan/50"
              onClick={() => navigate('/evacuation-flow')}
            >
              <TrafficCone className="w-6 h-6 text-orange-400" />
              <span className="text-sm font-medium">Evacuation</span>
              <span className="text-xs text-muted-foreground">Traffic flow</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-quantum-cyan/10 hover:border-quantum-cyan/50"
              onClick={() => navigate('/grid-recovery')}
            >
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-sm font-medium">Grid Recovery</span>
              <span className="text-xs text-muted-foreground">Infrastructure</span>
            </Button>
          </div>
        </GlassCard>

        {/* Emergency Contact */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-quantum-cyan" />
            Emergency Contact
          </h3>

          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex items-center justify-center gap-2"
            onClick={() => window.open('tel:112')}
          >
            <Phone className="w-5 h-5" />
            <span className="text-lg font-medium">Call 112 (Emergency)</span>
          </Button>
        </GlassCard>
      </div>
    </Layout>
  );
}
