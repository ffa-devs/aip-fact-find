'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step1Schema, Step1FormData } from '@/lib/validations/form-schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { PhoneNumberInput } from '@/components/ui/phone-input';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface Step1Props {
  onNext: () => void;
}

export function Step1LeadCapture({ onNext }: Step1Props) {
  const { step1, updateStep1, setGhlContactId, setGhlOpportunityId, ghlContactId } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step1FormData>({
    resolver: async (values, context, options) => {
      // Convert date_of_birth to Date if it's a string
      const processedValues = {
        ...values,
        date_of_birth: values.date_of_birth instanceof Date 
          ? values.date_of_birth 
          : typeof values.date_of_birth === 'string'
          ? new Date(values.date_of_birth)
          : values.date_of_birth,
      };
      return zodResolver(step1Schema)(processedValues, context, options);
    },
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: {
      first_name: step1.first_name,
      last_name: step1.last_name,
      date_of_birth: step1.date_of_birth || undefined,
      email: step1.email,
      mobile: step1.mobile,
    },
  });

  const onSubmit = async (data: Step1FormData) => {
    setIsSubmitting(true);
    
    try {
      updateStep1(data);
      
      // Create GHL contact if not already created
      if (!ghlContactId) {
        try {
          const response = await fetch('/api/gohigh/create-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (result.success && result.contactId) {
            setGhlContactId(result.contactId);
            if (result.opportunityId) {
              setGhlOpportunityId(result.opportunityId);
            }
            toast.success('Lead created successfully!', {
              description: 'Your information has been saved',
            });
          } else {
            console.error('Failed to create GHL contact:', result.error);
            toast.error('Note: Could not sync with CRM', {
              description: 'Your form data is still saved locally',
            });
          }
        } catch (error) {
          console.error('Error creating GHL contact:', error);
          toast.error('Note: Could not sync with CRM', {
            description: 'Your form data is still saved locally',
          });
        }
      }
      
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    // Show toast notification
    toast.error('Please fill in all required fields correctly', {
      description: 'Check the highlighted fields below',
    });

    // Scroll to first error when validation fails
    setTimeout(() => {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
    }, 100);
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const selectedDate = form.watch('date_of_birth');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Let&apos;s Get Started</h2>
            <p className="text-muted-foreground mt-1">
              Just a few quick details to begin your application
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                          fieldState.error && 'border-destructive focus-visible:ring-destructive/20'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                      captionLayout='dropdown'
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground">
                    You are {calculateAge(selectedDate)} years old
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.smith@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number *</FormLabel>
                <FormControl>
                  <PhoneNumberInput
                    placeholder="+34 123 456 789"
                    defaultCountry="ES"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating Lead...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
