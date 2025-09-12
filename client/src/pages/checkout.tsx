import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  planId: string;
  discountCode: string;
  planDetails: any;
}

const CheckoutForm = ({ planId, discountCode, planDetails }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      setLocation('/dashboard');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Order Summary</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">{planDetails.name}</span>
          <span className="font-medium">{formatCurrency(planDetails.price)}</span>
        </div>
        {discountCode && (
          <div className="flex justify-between items-center mb-2 text-green-600">
            <span>Discount ({discountCode})</span>
            <span>-20%</span>
          </div>
        )}
        <hr className="my-2" />
        <div className="flex justify-between items-center font-semibold">
          <span>Total</span>
          <span data-testid="text-total-amount">
            {formatCurrency(discountCode ? parseFloat(planDetails.price) * 0.8 : parseFloat(planDetails.price))}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <PaymentElement data-testid="payment-element" />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full"
        data-testid="button-pay"
      >
        {processing ? 'Processing...' : `Pay ${formatCurrency(discountCode ? parseFloat(planDetails.price) * 0.8 : parseFloat(planDetails.price))}`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [planId, setPlanId] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get plan details from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const planIdParam = urlParams.get('plan');
    const discountParam = urlParams.get('discount');
    
    if (planIdParam) {
      setPlanId(planIdParam);
      setDiscountCode(discountParam || '');
      fetchPlanAndCreatePaymentIntent(planIdParam, discountParam || '');
    } else {
      // Redirect to pricing if no plan selected
      window.location.href = '/pricing';
    }
  }, []);

  const fetchPlanAndCreatePaymentIntent = async (planId: string, discount: string) => {
    try {
      // First get subscription plans
      const plansResponse = await fetch('/api/subscription-plans');
      const plans = await plansResponse.json();
      const selectedPlan = plans.find((p: any) => p.id === planId);
      
      if (!selectedPlan) {
        throw new Error('Plan not found');
      }

      setPlanDetails(selectedPlan);

      // Create PaymentIntent
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        planId: planId,
        discountCode: discount
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="checkout-loading">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret || !planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Checkout Error</h2>
            <p className="text-muted-foreground mb-4">Unable to initialize payment. Please try again.</p>
            <Button onClick={() => window.location.href = '/pricing'} data-testid="button-back-to-pricing">
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8" data-testid="checkout-page">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Complete Your Purchase</CardTitle>
            <p className="text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                planId={planId} 
                discountCode={discountCode} 
                planDetails={planDetails}
              />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
}
