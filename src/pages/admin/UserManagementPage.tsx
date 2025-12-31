import { Layout } from '@/components/layout/Layout';
import { UserRoleManager } from '@/components/admin/UserRoleManager';

export default function UserManagementPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        
        <UserRoleManager />
      </div>
    </Layout>
  );
}
