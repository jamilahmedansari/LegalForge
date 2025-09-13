import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    userType: 'user' as 'user' | 'employee',
    phone: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const { signup, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.userType === 'admin') {
        setLocation('/admin/dashboard');
      } else if (user.userType === 'employee') {
        setLocation('/employee/dashboard');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) return;

    setLoading(true);
    try {
      const response = await signup(formData);
      
      // Redirect based on user type
      if (response.user.userType === 'employee') {
        setLocation('/employee/dashboard');
      } else {
        setLocation('/dashboard');
      }

      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" data-testid="signup-page">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Create your account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Start generating professional legal letters
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>I am a:</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => setFormData({...formData, userType: value as 'user' | 'employee'})}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" data-testid="radio-user" />
                    <Label htmlFor="user">User (Need Legal Letters)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employee" id="employee" data-testid="radio-employee" />
                    <Label htmlFor="employee">Employee (Earn Commissions)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                  data-testid="input-fullname"
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  data-testid="input-password"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  data-testid="input-phone"
                />
              </div>

              {formData.userType === 'user' && (
                <div>
                  <Label htmlFor="companyName">Company Name (Optional)</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    data-testid="input-company"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-create-account"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" data-testid="link-login">
                    <a className="font-medium text-primary hover:text-primary/80">Sign in</a>
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
