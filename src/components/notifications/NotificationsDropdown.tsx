import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Truck, Users, MapPin, CheckCircle2, X, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'vehicle' | 'shelter' | 'sos' | 'success' | 'info';
  title: string;
  message: string;
  location: string | null;
  read: boolean;
  created_at: string;
}

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
    case 'info':
      return <Info className="w-4 h-4 text-primary" />;
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

const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Just now';
  }
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev].slice(0, 20));
          
          // Show toast notification
          const toastType = newNotification.type === 'sos' || newNotification.type === 'alert' 
            ? 'error' 
            : newNotification.type === 'success' 
              ? 'success' 
              : 'info';
          
          if (toastType === 'error') {
            toast.error(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
              icon: newNotification.type === 'sos' ? '🆘' : '⚠️',
            });
          } else if (toastType === 'success') {
            toast.success(newNotification.title, {
              description: newNotification.message,
              duration: 4000,
            });
          } else {
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: 4000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      fetchNotifications();
    }
  };

  const dismissNotification = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      fetchNotifications();
    }
  };

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
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px] sm:h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary/20 transition-colors cursor-pointer group ${getNotificationBg(notification.type, notification.read)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="p-1 hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {notification.location && (
                          <>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{notification.location}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">•</span>
                          </>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 sm:p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
