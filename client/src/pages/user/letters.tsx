import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default function UserLetters() {
  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['/api/letters']
  });

  const sidebarLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/letters/new', label: 'New Letter', icon: 'fas fa-plus' },
    { href: '/letters', label: 'My Letters', icon: 'fas fa-file-alt' },
    { href: '/subscription', label: 'Subscription', icon: 'fas fa-credit-card' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar title="User Portal" icon="fas fa-scale-balanced" links={sidebarLinks} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" data-testid="letters-page">
      <Sidebar
        title="User Portal"
        icon="fas fa-scale-balanced"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">My Letters</h1>
            <p className="text-muted-foreground">View and manage all your legal letters</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Letters</CardTitle>
              <Link href="/letters/new">
                <Button data-testid="button-new-letter">
                  <i className="fas fa-plus mr-2"></i>New Letter
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {letters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4" data-testid="text-no-letters">No letters created yet</p>
                  <Link href="/letters/new">
                    <Button data-testid="button-create-first">Create Your First Letter</Button>
                  </Link>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {letters.map((letter: any) => (
                        <tr key={letter.id} data-testid={`row-letter-${letter.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{letter.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{letter.recipientName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`status-badge status-${letter.status}`}>
                              {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(letter.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {letter.completedAt ? formatDate(letter.completedAt) : formatDate(letter.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <a href="#" className="text-primary hover:text-primary/80" data-testid={`link-view-${letter.id}`}>View</a>
                            {letter.status === 'completed' && (
                              <a href="#" className="text-primary hover:text-primary/80" data-testid={`link-download-${letter.id}`}>Download</a>
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
