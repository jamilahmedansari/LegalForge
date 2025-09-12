import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

// Mock user data for display since we don't have a getAllUsers endpoint
const mockUsers = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    userType: 'user',
    createdAt: new Date().toISOString(),
    subscription: {
      plan: 'Monthly Plan',
      lettersUsed: 12,
      lettersRemaining: 36
    }
  },
  {
    id: '2', 
    fullName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    userType: 'user',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Premium Plan',
      lettersUsed: 23,
      lettersRemaining: 73
    }
  }
];

export default function AdminUsers() {
  const sidebarLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/letters', label: 'All Letters', icon: 'fas fa-file-alt' },
    { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
    { href: '/admin/employees', label: 'Employees', icon: 'fas fa-user-tie' }
  ];

  // In a real implementation, this would fetch from /api/admin/users
  const users = mockUsers;

  return (
    <div className="flex h-screen bg-background" data-testid="admin-users-page">
      <Sidebar
        title="Admin Portal"
        icon="fas fa-user-shield"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage platform users and their subscriptions</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Users ({users.length})</CardTitle>
              <Button data-testid="button-add-user">
                <i className="fas fa-plus mr-2"></i>Add User
              </Button>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-users">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscription</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Letters Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {users.map((user: any) => (
                        <tr key={user.id} data-testid={`row-user-${user.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-medium text-primary">
                                  {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-foreground">{user.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.subscription ? (
                              <Badge variant={user.subscription.plan.includes('Premium') ? 'default' : 'secondary'}>
                                {user.subscription.plan}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No subscription</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {user.subscription ? 
                              `${user.subscription.lettersUsed} / ${user.subscription.lettersUsed + user.subscription.lettersRemaining}` : 
                              '0 / 0'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-view-${user.id}`}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-edit-${user.id}`}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
