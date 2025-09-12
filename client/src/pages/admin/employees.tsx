import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

// Mock employee data for display
const mockEmployees = [
  {
    id: '1',
    discountCode: 'EMPLOYEE20-JD',
    totalCommission: '2450.00',
    totalPoints: 49,
    performanceTier: 'gold',
    isActive: true,
    fullName: 'Jane Doe'
  },
  {
    id: '2',
    discountCode: 'EMPLOYEE20-MS', 
    totalCommission: '2100.00',
    totalPoints: 42,
    performanceTier: 'silver',
    isActive: true,
    fullName: 'Mike Smith'
  }
];

export default function AdminEmployees() {
  const sidebarLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/letters', label: 'All Letters', icon: 'fas fa-file-alt' },
    { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
    { href: '/admin/employees', label: 'Employees', icon: 'fas fa-user-tie' }
  ];

  // In a real implementation, this would fetch from /api/admin/employees
  const employees = mockEmployees;

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'default';
      case 'gold':
        return 'secondary';
      case 'silver':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex h-screen bg-background" data-testid="admin-employees-page">
      <Sidebar
        title="Admin Portal"
        icon="fas fa-user-shield"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground">Manage employees, commission rates, and performance</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Employees ({employees.length})</CardTitle>
              <Button data-testid="button-add-employee">
                <i className="fas fa-plus mr-2"></i>Add Employee
              </Button>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-employees">No employees found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Referrals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance Tier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {employees.map((employee: any) => (
                        <tr key={employee.id} data-testid={`row-employee-${employee.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-medium text-primary">
                                  {employee.fullName?.split(' ').map((n: string) => n[0]).join('') || 'EMP'}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {employee.fullName || `Employee #${employee.id.slice(-8)}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                            {employee.discountCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {employee.totalPoints || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {formatCurrency(employee.totalCommission)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getTierBadgeVariant(employee.performanceTier)}>
                              {employee.performanceTier.charAt(0).toUpperCase() + employee.performanceTier.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-view-${employee.id}`}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-edit-${employee.id}`}
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
