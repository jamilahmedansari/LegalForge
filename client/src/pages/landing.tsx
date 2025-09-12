import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div data-testid="landing-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional Legal Letters
              <span className="text-primary block">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
              Generate attorney-reviewed legal letters in minutes. Our AI-powered platform creates professional demand letters, cease and desist notices, and legal correspondence tailored to your specific needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button size="lg" data-testid="button-start-creating">
                  Start Creating Letters
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" data-testid="button-view-pricing">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Why Choose LegalLetter Pro?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Professional-grade legal letters with attorney oversight</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-robot text-primary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground">Our advanced AI creates professional legal content tailored to your specific situation and requirements.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-user-tie text-primary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Attorney Review</h3>
              <p className="text-muted-foreground">Every letter is reviewed by licensed attorneys to ensure legal accuracy and effectiveness.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-download text-primary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Instant Download</h3>
              <p className="text-muted-foreground">Get your completed legal letters as professional PDF documents ready to send.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-muted-foreground">Flexible pricing for individuals and businesses</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Single Letter Plan */}
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Single Letter</h3>
                <p className="text-muted-foreground mt-2">Perfect for one-time needs</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground">/letter</span>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">1 Professional Legal Letter</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">AI-Generated Content</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Attorney Review</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">PDF Download</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button variant="secondary" className="w-full mt-8" data-testid="button-single-plan">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Monthly Plan</h3>
                <p className="text-muted-foreground mt-2">48 letters per year</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">48 Letters Per Year</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Priority Review</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">PDF Downloads</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Email Support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full mt-8" data-testid="button-monthly-plan">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Premium Plan</h3>
                <p className="text-muted-foreground mt-2">96 letters per year</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground">$599</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">96 Letters Per Year</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Priority Review</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Custom Templates</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-foreground">Priority Support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button variant="secondary" className="w-full mt-8" data-testid="button-premium-plan">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
