import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, RefreshCw, UserCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  role: AppRole;
  role_id: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  operator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  volunteer: 'bg-green-500/20 text-green-400 border-green-500/30',
  user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  operator: 'Operator',
  volunteer: 'Volunteer',
  user: 'Civilian',
};

export function UserRoleManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, phone, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, user_id, role');

    if (rolesError) {
      toast({ title: 'Error', description: 'Failed to fetch roles', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRole[] = profiles.map(profile => {
      const userRole = roles.find(r => r.user_id === profile.user_id);
      return {
        ...profile,
        role: userRole?.role || 'user',
        role_id: userRole?.id || '',
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, roleId: string, newRole: AppRole) => {
    setUpdating(userId);
    
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', roleId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } else {
      toast({ 
        title: 'Role Updated', 
        description: `User role changed to ${ROLE_LABELS[newRole]}` 
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
    }
    
    setUpdating(null);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-quantum-purple" />
          User Role Management
        </h3>
        <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-quantum-cyan" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No users found</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-quantum-cyan/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-quantum-cyan" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name || 'Unnamed User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {user.user_id.slice(0, 8)}... • Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={`${ROLE_COLORS[user.role]} border`}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                
                <Select 
                  value={user.role} 
                  onValueChange={(value: AppRole) => updateUserRole(user.user_id, user.role_id, value)}
                  disabled={updating === user.user_id}
                >
                  <SelectTrigger className="w-[140px] bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-400" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="operator">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        Operator
                      </div>
                    </SelectItem>
                    <SelectItem value="volunteer">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        Volunteer
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        Civilian
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Role Permissions:</strong> Admin (full system access) → Operator (quantum algorithms) → Volunteer (field tasks) → Civilian (SOS & status)
        </p>
      </div>
    </GlassCard>
  );
}
