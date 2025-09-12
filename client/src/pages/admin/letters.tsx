import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminLetters() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['/api/letters']
  });

  const updateLetterMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiRequest('PATCH', `/api/letters/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/letters'] });
      toast({
        title: "Success",
        description: "Letter updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update letter",
        variant: "destructive",
      });
    }
  });

  const sidebarLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/letters', label: 'All Letters', icon: 'fas fa-file-alt' },
    { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
    { href: '/admin/employees', label: 'Employees', icon: 'fas fa-user-tie' }
  ];

  const handleStatusUpdate = (letterId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    updateLetterMutation.mutate({ id: letterId, updates });
  };

  const filteredLetters = letters.filter((letter: any) => 
    statusFilter === 'all' || letter.status === statusFilter
  );

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

  return (
    <div className="flex h-screen bg-background" data-testid="admin-letters-page">
      <Sidebar
        title="Admin Portal"
        icon="fas fa-user-shield"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">All Letters</h1>
            <p className="text-muted-foreground">Manage and review all platform letters</p>
          </div>

          {/* Letter Status Filter */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'secondary'}
                onClick={() => setStatusFilter('all')}
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'requested' ? 'default' : 'secondary'}
                onClick={() => setStatusFilter('requested')}
                data-testid="filter-requested"
              >
                Requested
              </Button>
              <Button
                variant={statusFilter === 'reviewing' ? 'default' : 'secondary'}
                onClick={() => setStatusFilter('reviewing')}
                data-testid="filter-reviewing"
              >
                Reviewing
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'secondary'}
                onClick={() => setStatusFilter('completed')}
                data-testid="filter-completed"
              >
                Completed
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Letters ({filteredLetters.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLetters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-letters">
                    {statusFilter === 'all' ? 'No letters found' : `No ${statusFilter} letters`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredLetters.map((letter: any) => (
                        <tr key={letter.id} data-testid={`row-letter-${letter.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                            #L-{letter.id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground max-w-xs truncate">
                            {letter.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {letter.recipientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`status-badge status-${letter.status}`}>
                              {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(letter.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {letter.status === 'requested' && letter.aiGeneratedContent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(letter.id, 'reviewing')}
                                disabled={updateLetterMutation.isPending}
                                data-testid={`button-review-${letter.id}`}
                              >
                                Start Review
                              </Button>
                            )}
                            {letter.status === 'reviewing' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(letter.id, 'completed')}
                                disabled={updateLetterMutation.isPending}
                                data-testid={`button-complete-${letter.id}`}
                              >
                                Mark Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-view-${letter.id}`}
                            >
                              View Details
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
