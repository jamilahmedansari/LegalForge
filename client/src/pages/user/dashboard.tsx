import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils';

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription']
  });

  const { data: letters = [] } = useQuery({
    queryKey: ['/api/letters']
  });

  const sidebarLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/letters/new', label: 'New Letter', icon: 'fas fa-plus' },
    { href: '/letters', label: 'My Letters', icon: 'fas fa-file-alt' },
    { href: '/subscription', label: 'Subscription', icon: 'fas fa-credit-card' }
  ];

  const stats = {
    total: letters.length,
    pending: letters.filter((l: any) => l.status === 'requested' || l.status === 'reviewing').length,
    completed: letters.filter((l: any) => l.status === 'completed').length,
    remaining: subscription?.lettersRemaining || 0
  };

  const recentLetters = letters.slice(-5).reverse();

  return (
    <div className="flex h-screen bg-background" data-testid="user-dashboard">
      <Sidebar
        title="User Portal"
        icon="fas fa-scale-balanced"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-welcome">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-muted-foreground">Manage your legal letters and subscription</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <i className="fas fa-file-alt text-primary"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Letters</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-letters">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-clock text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-pending-letters">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-check text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-completed-letters">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-calendar text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Letters Remaining</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-letters-remaining">{stats.remaining}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Letters */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Letters</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLetters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-letters">No letters created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {recentLetters.map((letter: any) => (
                        <tr key={letter.id} data-testid={`row-letter-${letter.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{letter.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{letter.recipientName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`status-badge status-${letter.status}`}>
                              {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(letter.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {letter.status === 'completed' ? (
                              <a href="#" className="text-primary hover:text-primary/80" data-testid={`link-download-${letter.id}`}>Download</a>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
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
