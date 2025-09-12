import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function EmployeePerformance() {
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

  const employee = dashboardData?.employee;
  const commissions = dashboardData?.commissions || [];
  
  // Calculate performance metrics
  const totalReferrals = commissions.length;
  const totalEarned = commissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount), 0);
  const averageCommission = totalReferrals > 0 ? totalEarned / totalReferrals : 0;
  
  // Performance tier logic
  const tierInfo = {
    bronze: { min: 0, max: 9, next: 'silver', icon: 'fas fa-medal', color: 'text-orange-600' },
    silver: { min: 10, max: 24, next: 'gold', icon: 'fas fa-medal', color: 'text-gray-600' },
    gold: { min: 25, max: 49, next: 'platinum', icon: 'fas fa-medal', color: 'text-yellow-600' },
    platinum: { min: 50, max: 999, next: null, icon: 'fas fa-crown', color: 'text-purple-600' }
  };

  const currentTier = employee?.performanceTier || 'bronze';
  const currentTierInfo = tierInfo[currentTier as keyof typeof tierInfo];
  const referralsToNext = currentTierInfo.next ? Math.max(0, tierInfo[currentTierInfo.next as keyof typeof tierInfo].min - totalReferrals) : 0;

  return (
    <div className="flex h-screen bg-background" data-testid="performance-page">
      <Sidebar
        title="Employee Portal"
        icon="fas fa-user-tie"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
            <p className="text-muted-foreground">Track your performance metrics and achievements</p>
          </div>

          {/* Performance Tier */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Current Performance Tier</h3>
                  <div className="flex items-center mt-2">
                    <span className="text-3xl font-bold text-foreground" data-testid="text-tier">
                      {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                    </span>
                    <i className={`${currentTierInfo.icon} ${currentTierInfo.color} text-2xl ml-3`}></i>
                  </div>
                </div>
                <div className="text-right">
                  {currentTierInfo.next ? (
                    <>
                      <p className="text-sm text-muted-foreground">Next tier: {currentTierInfo.next.charAt(0).toUpperCase() + currentTierInfo.next.slice(1)}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-referrals-to-next">
                        Need {referralsToNext} more referrals
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-green-600">Maximum tier achieved!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-users text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-referrals">
                      {totalReferrals}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-dollar-sign text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-earned">
                      {formatCurrency(totalEarned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <i className="fas fa-trophy text-purple-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-points">
                      {employee?.totalPoints || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <i className="fas fa-chart-line text-orange-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Commission</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-avg-commission">
                      {formatCurrency(averageCommission)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {totalReferrals >= 10 && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <i className="fas fa-star text-green-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">First 10 Referrals</h4>
                      <p className="text-sm text-muted-foreground">Reached your first milestone</p>
                    </div>
                  </div>
                )}
                
                {totalReferrals >= 25 && (
                  <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <i className="fas fa-medal text-yellow-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">25 Referrals</h4>
                      <p className="text-sm text-muted-foreground">Quarter century achievement</p>
                    </div>
                  </div>
                )}

                {totalEarned >= 1000 && (
                  <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <i className="fas fa-dollar-sign text-blue-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">$1K Earned</h4>
                      <p className="text-sm text-muted-foreground">First thousand dollars earned</p>
                    </div>
                  </div>
                )}

                {totalReferrals >= 50 && (
                  <div className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <i className="fas fa-crown text-purple-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">Platinum Status</h4>
                      <p className="text-sm text-muted-foreground">Reached platinum tier</p>
                    </div>
                  </div>
                )}

                {commissions.filter((c: any) => c.status === 'paid').length >= 5 && (
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <i className="fas fa-handshake text-orange-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">Reliable Partner</h4>
                      <p className="text-sm text-muted-foreground">5+ successful transactions</p>
                    </div>
                  </div>
                )}

                {totalReferrals === 0 && (
                  <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg col-span-full">
                    <i className="fas fa-rocket text-gray-500 text-2xl mr-4"></i>
                    <div>
                      <h4 className="font-medium text-foreground">Ready to Start</h4>
                      <p className="text-sm text-muted-foreground">Share your discount code to earn your first commission</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
