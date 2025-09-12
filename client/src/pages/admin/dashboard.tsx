import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard']
  });

  const sidebarLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/letters', label: 'All Letters', icon: 'fas fa-file-alt' },
    { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
    { href: '/admin/employees', label: 'Employees', icon: 'fas fa-user-tie' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar title="Admin Portal" icon="fas fa-user-shield" links={sidebarLinks} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  const data = dashboardData || {};
  const recentLetters = data.recentLetters || [];
  const topEmployees = data.topEmployees || [];

  return (
    <div className="flex h-screen bg-background" data-testid="admin-dashboard">
      <Sidebar
        title="Admin Portal"
        icon="fas fa-user-shield"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-users text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-users">
                      {data.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-file-alt text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Letters Generated</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-letters">
                      {data.totalLetters || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-dollar-sign text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-revenue">
                      --
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <i className="fas fa-user-tie text-purple-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-employees">
                      {data.activeEmployees || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Letters */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Letters</CardTitle>
              </CardHeader>
              <CardContent>
                {recentLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" data-testid="text-no-recent-letters">No recent letters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLetters.map((letter: any) => (
                      <div key={letter.id} className="flex items-center justify-between" data-testid={`item-letter-${letter.id}`}>
                        <div>
                          <p className="text-sm font-medium text-foreground">{letter.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(letter.createdAt)}
                          </p>
                        </div>
                        <span className={`status-badge status-${letter.status}`}>
                          {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Employees */}
            <Card>
              <CardHeader>
                <CardTitle>Top Employees</CardTitle>
              </CardHeader>
              <CardContent>
                {topEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" data-testid="text-no-employees">No employees yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topEmployees.map((employee: any, index: number) => (
                      <div key={employee.id} className="flex items-center justify-between" data-testid={`item-employee-${employee.id}`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-primary">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Employee #{employee.id.slice(-8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {employee.performanceTier} tier
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          ${parseFloat(employee.totalCommission).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
