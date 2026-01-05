import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, MapPinOff, Loader2 } from 'lucide-react';

interface LocationTrackerProps {
  className?: string;
}

export function LocationTracker({ className }: LocationTrackerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    // Check if assignment exists
    const { data: existing } = await supabase
      .from('volunteer_assignments')
      .select('id')
      .eq('volunteer_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      // Update existing assignment
      await supabase
        .from('volunteer_assignments')
        .update({ current_location: location })
        .eq('id', existing.id);
      
      setAssignmentId(existing.id);
    } else {
      // Create new assignment
      const { data: newAssignment } = await supabase
        .from('volunteer_assignments')
        .insert({
          volunteer_id: user.id,
          status: 'active',
          current_location: location,
        })
        .select('id')
        .single();

      if (newAssignment) {
        setAssignmentId(newAssignment.id);
      }
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to share your location');
      return;
    }

    setIsConnecting(true);

    // Request location permission and start tracking
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updateLocation(position);
        
        // Start watching position
        const watchId = navigator.geolocation.watchPosition(
          updateLocation,
          (error) => {
            console.error('Location error:', error);
            toast.error('Failed to get location');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );

        watchIdRef.current = watchId;
        setIsConnected(true);
        setIsConnecting(false);
        toast.success('Live location connected! You are now visible on the map.');
      },
      (error) => {
        setIsConnecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access.');
        } else {
          toast.error('Failed to get your location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [updateLocation]);

  const handleDisconnect = useCallback(async () => {
    // Stop watching position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Update assignment status to idle and clear location
    if (assignmentId) {
      await supabase
        .from('volunteer_assignments')
        .update({ 
          status: 'idle',
          current_location: null,
        })
        .eq('id', assignmentId);
    }

    setIsConnected(false);
    setAssignmentId(null);
    toast.success('Location disconnected. You are no longer visible on the map.');
  }, [assignmentId]);

  return (
    <Button
      variant={isConnected ? 'destructive' : 'default'}
      size="sm"
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isConnecting}
      className={className}
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <MapPinOff className="h-4 w-4 mr-2" />
          Disconnect
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4 mr-2" />
          Connect Location
        </>
      )}
    </Button>
  );
}
