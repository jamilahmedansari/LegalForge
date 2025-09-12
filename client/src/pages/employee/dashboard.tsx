import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/employee/dashboard']
  });

  const sidebarLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/employee/commissions', label: 'Commissions', icon: 'fas fa-dollar-sign' },
    { href: '/employee/performance', label: 'Performance', icon: 'fas fa-chart-line' }
  ];

  const copyDiscountCode = async () => {
    if (dashboardData?.employee?.discountCode) {
      try {
        await navigator.clipboard.writeText(dashboardData.employee.discountCode);
        toast({
          title: "Copied!",
          description: "Discount code copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy discount code",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar title="Employee Portal" icon="fas fa-user-tie" links={sidebarLinks} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  const employee = dashboardData?.employee;
  const commissions = dashboardData?.commissions || [];
  const recentCommissions = commissions.slice(-5).reverse();

  return (
    <div className="flex h-screen bg-background" data-testid="employee-dashboard">
      <Sidebar
        title="Employee Portal"
        icon="fas fa-user-tie"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Employee Dashboard</h1>
            <p className="text-muted-foreground">Track your referrals, commissions, and performance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <i className="fas fa-dollar-sign text-primary"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-commissions">
                      {formatCurrency(employee?.totalCommission || '0')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-users text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-referrals">
                      {commissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-star text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Performance Tier</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-performance-tier">
                      {employee?.performanceTier?.charAt(0).toUpperCase() + employee?.performanceTier?.slice(1) || 'Bronze'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-percentage text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-commission-rate">
                      {((parseFloat(employee?.commissionRate || '0.05')) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discount Code */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Discount Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      readOnly 
                      value={employee?.discountCode || ''} 
                      className="block w-full border border-input rounded-md px-3 py-2 text-foreground bg-muted"
                      data-testid="input-discount-code"
                    />
                    <Button 
                      onClick={copyDiscountCode} 
                      className="ml-2"
                      data-testid="button-copy-code"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {employee?.discountPercentage || 20}% discount for new customers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCommissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-referrals">No referrals yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {recentCommissions.map((commission: any) => (
                        <tr key={commission.id} data-testid={`row-commission-${commission.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            Customer #{commission.subscriptionId.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {formatCurrency(commission.commissionAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(commission.createdAt)}
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
