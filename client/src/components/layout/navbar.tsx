import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (user) {
    return null; // Dashboard layouts handle their own navigation
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center">
                <i className="fas fa-scale-balanced text-primary text-2xl mr-3"></i>
                <h1 className="text-xl font-bold text-foreground">LegalLetter Pro</h1>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" data-testid="link-home-nav">
              <a className={`text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium ${location === '/' ? 'text-foreground' : ''}`}>
                Home
              </a>
            </Link>
            <Link href="/pricing" data-testid="link-pricing">
              <a className={`text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium ${location === '/pricing' ? 'text-foreground' : ''}`}>
                Pricing
              </a>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
          </div>
        </div>
      </div>
    </header>
  );
}