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
import { FormNavigation } from '@/components/form/form-navigation';
import { updateApplicationWithGhlId } from '@/lib/services/api-service';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Step1Props {
  onNext: () => void;
}

export function Step1LeadCapture({ onNext }: Step1Props) {
  const { 
    step1, 
    updateStep1, 
    setGhlContactId, 
    setGhlOpportunityId, 
    ghlContactId,
    applicationId,
    createNewApplication,
    lastError,
    clearError
  } = useFormStore();
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
      date_of_birth: step1.date_of_birth 
        ? (step1.date_of_birth instanceof Date ? step1.date_of_birth : new Date(step1.date_of_birth))
        : undefined,
      email: step1.email,
      mobile: step1.mobile,
    },
  });

  // Reset form when step1 data changes (e.g., from localStorage or navigation)
  useEffect(() => {
    form.reset({
      first_name: step1.first_name,
      last_name: step1.last_name,
      date_of_birth: step1.date_of_birth 
        ? (step1.date_of_birth instanceof Date ? step1.date_of_birth : new Date(step1.date_of_birth))
        : undefined,
      email: step1.email,
      mobile: step1.mobile,
    });
  }, [step1, form]);

  const onSubmit = async (data: Step1FormData) => {
    setIsSubmitting(true);
    clearError(); // Clear any previous errors
    
    console.log('Step 1 onSubmit data:', data);
    console.log('date_of_birth type:', typeof data.date_of_birth);
    console.log('date_of_birth value:', data.date_of_birth);
    
    try {
      // Create application if it doesn't exist
      let currentApplicationId = applicationId;
      if (!currentApplicationId) {
        currentApplicationId = await createNewApplication();
        if (!currentApplicationId) {
          throw new Error('Failed to create application');
        }
      }

      // Update Step 1 data (this will auto-sync to database)
      await updateStep1(data);

      // Check for database sync errors
      if (lastError) {
        console.error('Database sync error:', lastError);
        // Continue with GHL integration but show warning
        toast.error('Database sync warning', {
          description: 'Data saved locally but may not be synced to server',
        });
      }
      
      // Always sync with GHL (create or update contact)
      try {
        const response = await fetch('/api/gohigh/create-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success && result.contactId) {
          // Update contact ID in store if not already set
          if (!ghlContactId) {
            setGhlContactId(result.contactId);
          }
          if (result.opportunityId && !ghlContactId) {
            setGhlOpportunityId(result.opportunityId);
          }

          // Save GHL IDs to Supabase 
          if (currentApplicationId) {
            try {
              const updateResult = await updateApplicationWithGhlId(
                currentApplicationId,
                result.contactId,
                result.opportunityId
              );
              
              if (updateResult.error) {
                console.error('Failed to update application with GHL ID:', updateResult.error);
                // Don't block the flow, just log the error
              } else {
                console.log('✅ Application updated with GHL IDs:', {
                  contactId: result.contactId,
                  opportunityId: result.opportunityId
                });
              }
            } catch (error) {
              console.error('Error updating application with GHL ID:', error);
              // Don't block the flow
            }
          }

          // If existing contact was found, prefill the form with their data
          if (result.isExisting && result.existingData) {
            const existingData = result.existingData;
            
            // Update form fields with existing data
            const updatedData = { ...data };
            if (existingData.first_name) {
              form.setValue('first_name', existingData.first_name);
              updatedData.first_name = existingData.first_name;
            }
            if (existingData.last_name) {
              form.setValue('last_name', existingData.last_name);
              updatedData.last_name = existingData.last_name;
            }
            if (existingData.mobile) {
              form.setValue('mobile', existingData.mobile);
              updatedData.mobile = existingData.mobile;
            }
            if (existingData.date_of_birth) {
              const dob = new Date(existingData.date_of_birth);
              form.setValue('date_of_birth', dob);
              updatedData.date_of_birth = dob;
            }
            
            // Update with merged data
            await updateStep1(updatedData);

            toast.success('Contact updated!', {
              description: 'Your information has been synced with our records',
            });
          } else {
            toast.success('Lead created successfully!', {
              description: 'Your information has been saved',
            });
          }
        } else {
          console.error('Failed to sync with GHL:', result.error);
          toast.error('Note: Could not sync with CRM', {
            description: 'Your form data is still saved locally',
          });
        }
      } catch (error) {
        console.error('Error syncing with GHL:', error);
        toast.error('Note: Could not sync with CRM', {
          description: 'Your form data is still saved locally',
        });
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

  const calculateAge = (date: Date | string | null | undefined) => {
    if (!date) return 0;
    
    // Convert to Date if it's a string
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }
    return age;
  };

  const selectedDate = form.watch('date_of_birth');

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">

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

        {/* Disclaimer */}
        <div className="py-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              We treat your details and information with respect. The data provided will be kept as long as the commercial relationship is maintained or during the years necessary to comply with the legal obligations. The information you provide us with will not be transferred to any third parties without your knowledge or consent in accordance with EU GDPR regulations and LCCI Spanish mortgages laws. Fluent Finance Abroad are Bank of Spain registered mortgage intermediaries with licence number D305.
            </p>
          </div>
        </div>

        <FormNavigation 
          onNext={() => form.handleSubmit(onSubmit, onError)()} 
          isSubmitting={isSubmitting} 
          showBack={false}
          showSaveForLater={false}
        />
      </form>
    </Form>
  );
}
