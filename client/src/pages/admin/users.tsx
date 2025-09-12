import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { User, UserSubscription } from '@shared/schema';

type UserWithSubscription = User & {
  subscription?: UserSubscription;
};

export default function AdminUsers() {
  const sidebarLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/letters', label: 'All Letters', icon: 'fas fa-file-alt' },
    { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
    { href: '/admin/employees', label: 'Employees', icon: 'fas fa-user-tie' }
  ];

  const { data: users = [], isLoading, error } = useQuery<UserWithSubscription[]>({
    queryKey: ['/api/admin/users']
  });

  if (error) {
    return (
      <div className="flex h-screen bg-background" data-testid="admin-users-page">
        <Sidebar
          title="Admin Portal"
          icon="fas fa-user-shield"
          links={sidebarLinks}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading users</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

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
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[160px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
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
                              <Badge variant={user.subscription.lettersRemaining > 50 ? 'default' : 'secondary'}>
                                Active Plan
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No subscription</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {user.subscription ? 
                              `${user.subscription.lettersUsed || 0} / ${(user.subscription.lettersUsed || 0) + (user.subscription.lettersRemaining || 0)}` : 
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
