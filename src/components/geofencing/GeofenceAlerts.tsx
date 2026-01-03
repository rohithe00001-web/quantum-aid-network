import { useGeofencing } from '@/hooks/useGeofencing';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Check, X, RefreshCw, Truck, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GeofenceAlertsProps {
  compact?: boolean;
}

export function GeofenceAlerts({ compact = false }: GeofenceAlertsProps) {
  const { alerts, loading, acknowledgeAlert, resolveAlert, refetch } = useGeofencing();

  if (compact && alerts.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-4" variant="quantum">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Geofence Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </h3>
        <Button size="sm" variant="ghost" onClick={refetch} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active geofence alerts</p>
          <p className="text-xs mt-1">All entities are within operational boundaries</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.entity_type === 'vehicle' ? (
                      <Truck className="w-5 h-5 text-destructive" />
                    ) : (
                      <Users className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {alert.entity_label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Exited operational area
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acknowledgeAlert(alert.id)}
                    title="Acknowledge"
                    className="h-8 w-8 p-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveAlert(alert.id)}
                    title="Resolve"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!compact && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          Alerts trigger when vehicles or volunteers exit the defined operational area
        </p>
      )}
    </GlassCard>
  );
}
