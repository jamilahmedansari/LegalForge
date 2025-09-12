import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('USA')
});

const letterSchema = z.object({
  senderName: z.string().min(1, 'Sender name is required'),
  senderFirmName: z.string().optional(),
  senderAddress: addressSchema,
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientAddress: addressSchema,
  subject: z.string().min(1, 'Subject is required'),
  conflictDescription: z.string().min(10, 'Conflict description must be at least 10 characters'),
  desiredResolution: z.string().min(10, 'Desired resolution must be at least 10 characters'),
  additionalNotes: z.string().optional()
});

type LetterFormData = z.infer<typeof letterSchema>;

export default function NewLetter() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LetterFormData>({
    resolver: zodResolver(letterSchema),
    defaultValues: {
      senderName: '',
      senderFirmName: '',
      senderAddress: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      },
      recipientName: '',
      recipientAddress: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      },
      subject: '',
      conflictDescription: '',
      desiredResolution: '',
      additionalNotes: ''
    }
  });

  const createLetterMutation = useMutation({
    mutationFn: (data: LetterFormData) => apiRequest('POST', '/api/letters', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Letter request submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/letters'] });
      setLocation('/letters');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create letter",
        variant: "destructive",
      });
    }
  });

  const sidebarLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/letters/new', label: 'New Letter', icon: 'fas fa-plus' },
    { href: '/letters', label: 'My Letters', icon: 'fas fa-file-alt' },
    { href: '/subscription', label: 'Subscription', icon: 'fas fa-credit-card' }
  ];

  const onSubmit = (data: LetterFormData) => {
    createLetterMutation.mutate(data);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <Card data-testid="step-sender-info">
            <CardHeader>
              <CardTitle>Step 1: Sender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sender-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderFirmName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firm/Company Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sender-firm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="senderAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-sender-street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="senderAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sender-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sender-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderAddress.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sender-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button onClick={() => setStep(2)} data-testid="button-next-recipient">
                Next: Recipient Information
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card data-testid="step-recipient-info">
            <CardHeader>
              <CardTitle>Step 2: Recipient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-recipient-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Letter Subject</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="recipientAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-recipient-street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="recipientAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-recipient-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recipientAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-recipient-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recipientAddress.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-recipient-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep(1)} data-testid="button-previous-sender">
                  Previous
                </Button>
                <Button onClick={() => setStep(3)} data-testid="button-next-content">
                  Next: Letter Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card data-testid="step-letter-content">
            <CardHeader>
              <CardTitle>Step 3: Letter Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="conflictDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conflict Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Describe the issue or conflict that needs to be addressed..."
                        data-testid="textarea-conflict"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="desiredResolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Resolution</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="What outcome are you seeking?"
                        data-testid="textarea-resolution"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={3}
                        placeholder="Any additional information or special circumstances..."
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep(2)} data-testid="button-previous-recipient">
                  Previous
                </Button>
                <Button onClick={() => setStep(4)} data-testid="button-next-review">
                  Review & Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card data-testid="step-review">
            <CardHeader>
              <CardTitle>Step 4: Review Your Letter Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Sender</h4>
                <p>{form.getValues('senderName')}</p>
                {form.getValues('senderFirmName') && <p>{form.getValues('senderFirmName')}</p>}
                <p>{form.getValues('senderAddress.street')}</p>
                <p>{form.getValues('senderAddress.city')}, {form.getValues('senderAddress.state')} {form.getValues('senderAddress.zip')}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Recipient</h4>
                <p>{form.getValues('recipientName')}</p>
                <p>{form.getValues('recipientAddress.street')}</p>
                <p>{form.getValues('recipientAddress.city')}, {form.getValues('recipientAddress.state')} {form.getValues('recipientAddress.zip')}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Subject</h4>
                <p>{form.getValues('subject')}</p>
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep(3)} data-testid="button-edit-details">
                  Edit Details
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createLetterMutation.isPending}
                  data-testid="button-generate-letter"
                >
                  {createLetterMutation.isPending ? 'Generating...' : 'Generate Letter'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background" data-testid="new-letter-page">
      <Sidebar
        title="User Portal"
        icon="fas fa-scale-balanced"
        links={sidebarLinks}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create New Legal Letter</h1>
            <p className="text-muted-foreground">Fill out the form below to generate your professional legal letter</p>
          </div>

          <div className="max-w-4xl">
            {/* Step Indicator */}
            <div className="flex items-center mb-8">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className={`flex items-center ${num < 4 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === num ? 'bg-primary text-primary-foreground' :
                    step > num ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > num ? '✓' : num}
                  </div>
                  {num < 4 && <div className={`flex-1 h-1 mx-2 ${step > num ? 'bg-green-500' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            <Form {...form}>
              {renderStep()}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
