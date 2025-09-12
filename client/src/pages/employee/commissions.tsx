import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function EmployeeCommissions() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/employee/dashboard']
  });

  const sidebarLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/employee/commissions', label: 'Commissions', icon: 'fas fa-dollar-sign' },
    { href: '/employee/performance', label: 'Performance', icon: 'fas fa-chart-line' }
  ];

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

  const commissions = dashboardData?.commissions || [];
  const totalEarned = commissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount), 0);
  const thisMonth = new Date();
  const thisMonthCommissions = commissions.filter((c: any) => {
    const commissionDate = new Date(c.createdAt);
    return commissionDate.getMonth() === thisMonth.getMonth() && 
           commissionDate.getFullYear() === thisMonth.getFullYear();
  });
  const thisMonthTotal = thisMonthCommissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount), 0);
  const pendingCommissions = commissions.filter((c: any) => c.status === 'pending');
  const pendingTotal = pendingCommissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount), 0);

  return (
    <div className="flex h-screen bg-background" data-testid="commissions-page">
      <Sidebar
        title="Employee Portal"
        icon="fas fa-user-tie"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Commission Tracking</h1>
            <p className="text-muted-foreground">View your commission history and earnings</p>
          </div>

          {/* Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-foreground">This Month</h3>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-month-total">
                  {formatCurrency(thisMonthTotal)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {thisMonthCommissions.length} referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-foreground">Total Earned</h3>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-earned">
                  {formatCurrency(totalEarned)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {commissions.length} total referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-foreground">Pending</h3>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-pending-total">
                  {formatCurrency(pendingTotal)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingCommissions.length} awaiting payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission History */}
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-commissions">No commissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Commission Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {commissions.map((commission: any) => (
                        <tr key={commission.id} data-testid={`row-commission-${commission.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(commission.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            Customer #{commission.subscriptionId.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {(parseFloat(commission.commissionRate) * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {formatCurrency(commission.commissionAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {commission.pointsEarned}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                            </span>
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
