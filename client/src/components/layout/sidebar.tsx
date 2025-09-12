import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  title: string;
  icon: string;
  links: SidebarLink[];
}

export function Sidebar({ title, icon, links }: SidebarProps) {
  const { logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border" data-testid="sidebar">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <i className={`${icon} text-primary text-xl mr-3`}></i>
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      <nav className="mt-6">
        <div className="px-6">
          <div className="space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} data-testid={`link-${link.label.toLowerCase().replace(' ', '-')}`}>
                <a className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}>
                  <i className={`${link.icon} mr-3`}></i>
                  {link.label}
                </a>
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full text-left text-muted-foreground hover:bg-accent hover:text-accent-foreground group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-3"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
