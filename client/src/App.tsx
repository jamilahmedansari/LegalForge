import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/layout/navbar";

// Import pages
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import UserDashboard from "@/pages/user/dashboard";
import NewLetter from "@/pages/user/new-letter";
import UserLetters from "@/pages/user/letters";
import UserSubscription from "@/pages/user/subscription";
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeCommissions from "@/pages/employee/commissions";
import EmployeePerformance from "@/pages/employee/performance";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLetters from "@/pages/admin/letters";
import AdminUsers from "@/pages/admin/users";
import AdminEmployees from "@/pages/admin/employees";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/checkout" component={Checkout} />

      {/* User routes */}
      <Route path="/dashboard">
        <AuthGuard allowedRoles={['user']}>
          <UserDashboard />
        </AuthGuard>
      </Route>
      <Route path="/letters/new">
        <AuthGuard allowedRoles={['user']}>
          <NewLetter />
        </AuthGuard>
      </Route>
      <Route path="/letters">
        <AuthGuard allowedRoles={['user']}>
          <UserLetters />
        </AuthGuard>
      </Route>
      <Route path="/subscription">
        <AuthGuard allowedRoles={['user']}>
          <UserSubscription />
        </AuthGuard>
      </Route>

      {/* Employee routes */}
      <Route path="/employee/dashboard">
        <AuthGuard allowedRoles={['employee']}>
          <EmployeeDashboard />
        </AuthGuard>
      </Route>
      <Route path="/employee/commissions">
        <AuthGuard allowedRoles={['employee']}>
          <EmployeeCommissions />
        </AuthGuard>
      </Route>
      <Route path="/employee/performance">
        <AuthGuard allowedRoles={['employee']}>
          <EmployeePerformance />
        </AuthGuard>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/dashboard">
        <AuthGuard allowedRoles={['admin']}>
          <AdminDashboard />
        </AuthGuard>
      </Route>
      <Route path="/admin/letters">
        <AuthGuard allowedRoles={['admin']}>
          <AdminLetters />
        </AuthGuard>
      </Route>
      <Route path="/admin/users">
        <AuthGuard allowedRoles={['admin']}>
          <AdminUsers />
        </AuthGuard>
      </Route>
      <Route path="/admin/employees">
        <AuthGuard allowedRoles={['admin']}>
          <AdminEmployees />
        </AuthGuard>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Router />
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
