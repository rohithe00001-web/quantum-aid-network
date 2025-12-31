import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ScanLine, MapPin, Clock, RefreshCw, 
  AlertCircle, AlertTriangle, ShieldCheck, Eye
} from 'lucide-react';

interface Classification {
  label: string;
  confidence: number;
  category: 'danger' | 'warning' | 'safe';
}

interface QVisionAnalysis {
  id: string;
  user_id: string;
  classifications: Classification[];
  summary: string;
  recommendations: string[];
  location: { lat: number; lng: number };
  created_at: string;
  status: string;
  profile?: {
    full_name: string | null;
  };
}

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'danger':
      return { color: 'text-destructive', bg: 'bg-destructive/20', border: 'border-destructive/30' };
    case 'warning':
      return { color: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/30' };
    case 'safe':
      return { color: 'text-success', bg: 'bg-success/20', border: 'border-success/30' };
    default:
      return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'danger':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'safe':
      return ShieldCheck;
    default:
      return Eye;
  }
};

export function QVisionFeed() {
  const [analyses, setAnalyses] = useState<QVisionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<QVisionAnalysis | null>(null);

  useEffect(() => {
    fetchAnalyses();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('qvision_analyses_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qvision_analyses'
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('qvision_analyses')
      .select(`
        id,
        user_id,
        classifications,
        summary,
        recommendations,
        location,
        created_at,
        status
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching Q-Vision analyses:', error);
      setLoading(false);
      return;
    }

    // Fetch user profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const analysesWithProfiles = data.map(analysis => ({
        ...analysis,
        classifications: (analysis.classifications || []) as unknown as Classification[],
        recommendations: (analysis.recommendations || []) as unknown as string[],
        location: (analysis.location || { lat: 0, lng: 0 }) as { lat: number; lng: number },
        profile: profileMap.get(analysis.user_id) as { full_name: string | null } | undefined
      }));

      setAnalyses(analysesWithProfiles);
    } else {
      setAnalyses([]);
    }

    setLoading(false);
  };

  const getHighestSeverity = (classifications: Classification[]) => {
    if (classifications.some(c => c.category === 'danger')) return 'danger';
    if (classifications.some(c => c.category === 'warning')) return 'warning';
    return 'safe';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <GlassCard className="p-0" variant="quantum">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Q-Vision Hazard Feed</h3>
          <Badge variant="outline" className="text-xs">
            {analyses.length} Reports
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchAnalyses}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {loading && analyses.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading analyses...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-8 text-center">
            <ScanLine className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mt-2">No hazard reports yet</p>
            <p className="text-xs text-muted-foreground">Reports from civilians will appear here in real-time</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {analyses.map((analysis, index) => {
              const severity = getHighestSeverity(analysis.classifications);
              const styles = getCategoryStyles(severity);
              const SeverityIcon = getCategoryIcon(severity);

              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer ${
                    selectedAnalysis?.id === analysis.id ? 'bg-secondary/50' : ''
                  }`}
                  onClick={() => setSelectedAnalysis(
                    selectedAnalysis?.id === analysis.id ? null : analysis
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${styles.bg} ${styles.border} border`}>
                        <SeverityIcon className={`w-4 h-4 ${styles.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {analysis.profile?.full_name || 'Anonymous User'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${styles.color} ${styles.bg} ${styles.border}`}
                          >
                            {severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {analysis.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {analysis.location.lat.toFixed(4)}, {analysis.location.lng.toFixed(4)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(analysis.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedAnalysis?.id === analysis.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border/50"
                      >
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-foreground mb-2">Classifications</p>
                            <div className="space-y-2">
                              {analysis.classifications.map((cls, i) => {
                                const clsStyles = getCategoryStyles(cls.category);
                                return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className={`text-xs ${clsStyles.color}`}>{cls.label}</span>
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${clsStyles.bg.replace('/20', '')} rounded-full`}
                                        style={{ width: `${cls.confidence}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {cls.confidence}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">Recommendations</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {analysis.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-primary">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}
