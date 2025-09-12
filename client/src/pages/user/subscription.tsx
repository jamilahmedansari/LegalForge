import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function UserSubscription() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['/api/user/subscription']
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

  if (!subscription) {
    return (
      <div className="flex h-screen bg-background" data-testid="subscription-page">
        <Sidebar title="User Portal" icon="fas fa-scale-balanced" links={sidebarLinks} />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-no-subscription">No Active Subscription</h2>
              <p className="text-muted-foreground mb-8">You need an active subscription to generate legal letters.</p>
              <a href="/pricing" className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90" data-testid="link-choose-plan">
                Choose a Plan
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = (subscription.lettersUsed / (subscription.lettersUsed + subscription.lettersRemaining)) * 100;

  return (
    <div className="flex h-screen bg-background" data-testid="subscription-page">
      <Sidebar
        title="User Portal"
        icon="fas fa-scale-balanced"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
            <p className="text-muted-foreground">Manage your current plan and billing</p>
          </div>

          {/* Current Plan */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-foreground" data-testid="text-plan-name">Monthly Plan</h3>
                  <p className="text-muted-foreground mt-1">48 letters per year</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground">Letters Used:</span>
                      <span className="ml-2 text-sm font-medium text-foreground" data-testid="text-letters-used">
                        {subscription.lettersUsed} / {subscription.lettersUsed + subscription.lettersRemaining}
                      </span>
                    </div>
                    {subscription.expiresAt && (
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground">Renewal Date:</span>
                        <span className="ml-2 text-sm font-medium text-foreground" data-testid="text-renewal-date">
                          {formatDate(subscription.expiresAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" data-testid="text-status">
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground" data-testid="text-final-price">
                    {formatCurrency(subscription.finalPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Progress */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Usage Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Letters Used</span>
                    <span className="text-foreground font-medium" data-testid="text-usage-ratio">
                      {subscription.lettersUsed} / {subscription.lettersUsed + subscription.lettersRemaining}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" data-testid="progress-usage" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span className="font-medium" data-testid="text-original-price">{formatCurrency(subscription.originalPrice)}</span>
                </div>
                {parseFloat(subscription.discountAmount) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium text-green-600" data-testid="text-discount-amount">
                        -{formatCurrency(subscription.discountAmount)}
                      </span>
                    </div>
                    {subscription.discountCodeUsed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount Code:</span>
                        <span className="font-medium" data-testid="text-discount-code">{subscription.discountCodeUsed}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between border-t pt-4">
                  <span className="text-lg font-semibold">Total Paid:</span>
                  <span className="text-lg font-semibold" data-testid="text-total-paid">{formatCurrency(subscription.finalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
