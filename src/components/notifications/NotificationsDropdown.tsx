import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Truck, Users, MapPin, CheckCircle2, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'vehicle' | 'shelter' | 'sos' | 'success';
  title: string;
  message: string;
  location: string;
  time: string;
  read: boolean;
}

interface SOSRequest {
  id: string;
  status: string;
  location: { lat: number; lng: number; address?: string } | null;
  created_at: string;
  resolved_at: string | null;
}

const transformSOSToNotification = (sos: SOSRequest): Notification => {
  const locationText = sos.location?.address || 
    (sos.location ? `${sos.location.lat?.toFixed(4)}, ${sos.location.lng?.toFixed(4)}` : 'Unknown location');
  
  return {
    id: sos.id,
    type: sos.status === 'resolved' ? 'success' : 'sos',
    title: sos.status === 'resolved' ? 'SOS Request Resolved' : 'New SOS Request',
    message: sos.status === 'resolved' 
      ? 'Emergency request has been resolved' 
      : 'Emergency assistance requested',
    location: locationText,
    time: formatDistanceToNow(new Date(sos.created_at), { addSuffix: true }),
    read: sos.status === 'resolved',
  };
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'vehicle':
      return <Truck className="w-4 h-4 text-primary" />;
    case 'shelter':
      return <Users className="w-4 h-4 text-emerald-400" />;
    case 'sos':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationBg = (type: Notification['type'], read: boolean) => {
  if (read) return 'bg-secondary/30';
  switch (type) {
    case 'alert':
      return 'bg-warning/10 border-l-2 border-warning';
    case 'sos':
      return 'bg-destructive/10 border-l-2 border-destructive';
    case 'success':
      return 'bg-emerald-500/10 border-l-2 border-emerald-500';
    default:
      return 'bg-primary/10 border-l-2 border-primary';
  }
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch initial SOS requests
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('sos_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const sosNotifications = data.map((sos) => 
          transformSOSToNotification(sos as unknown as SOSRequest)
        );
        setNotifications(sosNotifications);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sos-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_requests'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = transformSOSToNotification(payload.new as SOSRequest);
            setNotifications(prev => [newNotification, ...prev].slice(0, 20));
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = transformSOSToNotification(payload.new as SOSRequest);
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as SOSRequest).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const isRead = (notification: Notification) => notification.read || readIds.has(notification.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary/20 transition-colors cursor-pointer ${getNotificationBg(notification.type, isRead(notification))}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${isRead(notification) ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="p-1 hover:bg-secondary rounded opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                      <p className={`text-xs mt-0.5 ${isRead(notification) ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {notification.location}
                        </div>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}