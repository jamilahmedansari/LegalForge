import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription']
  });

  const { data: letters = [] } = useQuery({
    queryKey: ['/api/letters']
  });

  // Download mutation for handling PDF downloads
  const downloadMutation = useMutation({
    mutationFn: async (letterId: string) => {
      const response = await fetch(`/api/letters/${letterId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || 'Download failed');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'legal_letter.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return letterId;
    },
    onSuccess: (letterId) => {
      // Invalidate letters query to refresh the status
      queryClient.invalidateQueries({ queryKey: ['/api/letters'] });
      toast({
        title: "Success",
        description: "Letter downloaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download letter",
        variant: "destructive",
      });
    }
  });

  const handleDownload = (letterId: string) => {
    downloadMutation.mutate(letterId);
  };

  const sidebarLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/letters/new', label: 'New Letter', icon: 'fas fa-plus' },
    { href: '/letters', label: 'My Letters', icon: 'fas fa-file-alt' },
    { href: '/subscription', label: 'Subscription', icon: 'fas fa-credit-card' }
  ];

  const stats = {
    total: letters.length,
    pending: letters.filter((l: any) => l.status === 'requested' || l.status === 'reviewing').length,
    completed: letters.filter((l: any) => l.status === 'completed' || l.status === 'downloaded').length,
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
                            {(letter.status === 'completed' || letter.status === 'downloaded') && letter.pdfUrl ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(letter.id)}
                                disabled={downloadMutation.isPending}
                                data-testid={`button-download-${letter.id}`}
                              >
                                {downloadMutation.isPending ? 'Downloading...' : 
                                 letter.status === 'downloaded' ? 'Download Again' : 'Download PDF'}
                              </Button>
                            ) : letter.status === 'completed' ? (
                              <span className="text-yellow-600 text-sm">PDF Processing...</span>
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
