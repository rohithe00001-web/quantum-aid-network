import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Navigation, MapPin, CheckCircle, Clock, 
  QrCode, Wifi, WifiOff, ArrowRight
} from 'lucide-react';

type VolunteerStatus = 'idle' | 'en_route' | 'task_complete';

interface RouteStep {
  id: number;
  location: string;
  type: string;
  distance: string;
  completed: boolean;
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VolunteerStatus>('idle');
  const [isOffline, setIsOffline] = useState(false);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);

  const [currentRoute] = useState<RouteStep[]>([
    { id: 1, location: 'Supply Depot A', type: 'pickup', distance: '2.3 mi', completed: true },
    { id: 2, location: 'Shelter B - Main St', type: 'delivery', distance: '4.1 mi', completed: false },
    { id: 3, location: 'Hospital A - Emergency', type: 'delivery', distance: '1.8 mi', completed: false },
  ]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('qr_code_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.qr_code_id) {
      setQrCodeId(data.qr_code_id);
    }
  };

  const updateStatus = async (newStatus: VolunteerStatus) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('volunteer_assignments')
        .upsert({
          volunteer_id: user.id,
          status: newStatus,
          assigned_at: new Date().toISOString()
        }, { onConflict: 'volunteer_id' });

      if (error) throw error;

      setStatus(newStatus);
      toast({
        title: 'Status Updated',
        description: `You are now ${newStatus.replace('_', ' ')}`
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update your status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (s: VolunteerStatus) => {
    switch (s) {
      case 'idle': return 'bg-gray-500';
      case 'en_route': return 'bg-quantum-cyan';
      case 'task_complete': return 'bg-green-500';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Volunteer Dashboard</h1>
            <p className="text-muted-foreground">Field Unit Interface</p>
          </div>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="flex items-center gap-1 px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                <WifiOff className="w-3 h-3" />
                OFFLINE MODE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                <Wifi className="w-3 h-3" />
                CONNECTED
              </span>
            )}
          </div>
        </div>

        {/* Status Toggle */}
        <GlassCard className="p-6" variant="quantum">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-quantum-cyan" />
            Status Toggle
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
            <span className="text-foreground capitalize">{status.replace('_', ' ')}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={status === 'idle' ? 'default' : 'outline'}
              onClick={() => updateStatus('idle')}
              className={status === 'idle' ? 'bg-gray-600' : ''}
            >
              Idle
            </Button>
            <Button
              variant={status === 'en_route' ? 'default' : 'outline'}
              onClick={() => updateStatus('en_route')}
              className={status === 'en_route' ? 'bg-quantum-cyan text-background' : ''}
            >
              En Route
            </Button>
            <Button
              variant={status === 'task_complete' ? 'default' : 'outline'}
              onClick={() => updateStatus('task_complete')}
              className={status === 'task_complete' ? 'bg-green-600' : ''}
            >
              Task Complete
            </Button>
          </div>
        </GlassCard>

        {/* My Optimized Route */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-quantum-cyan" />
            My Optimized Route
          </h3>

          <div className="space-y-3">
            {currentRoute.map((step, index) => (
              <div 
                key={step.id}
                className={`p-4 rounded-lg border ${
                  step.completed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-secondary/30 border-border/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 'bg-quantum-cyan/20 border border-quantum-cyan/30'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm text-quantum-cyan font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{step.location}</p>
                      <p className="text-xs text-muted-foreground capitalize">{step.type} • {step.distance}</p>
                    </div>
                  </div>
                  {!step.completed && (
                    <Button size="sm" variant="ghost" className="text-quantum-cyan">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-quantum-cyan/10 rounded-lg border border-quantum-cyan/20">
            <p className="text-sm text-quantum-cyan text-center">
              Route optimized by D-Wave Quantum Annealing
            </p>
          </div>
        </GlassCard>

        {/* QR Code ID */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-quantum-purple" />
            QR Code ID - Identity Verification
          </h3>

          <div className="flex flex-col items-center">
            <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4">
              {qrCodeId ? (
                <div className="text-center p-4">
                  <QrCode className="w-24 h-24 text-gray-800 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-mono break-all">{qrCodeId.slice(0, 16)}...</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs">Loading...</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Show this QR code when delivering supplies to verify your identity
            </p>
          </div>
        </GlassCard>

        {/* Offline Token Info */}
        {isOffline && (
          <GlassCard className="p-6 border-yellow-500/30">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Offline Mode Active</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your cached route and QR code are available. Status updates will sync when you reconnect.
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
}
