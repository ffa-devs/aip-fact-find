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
import { PhoneNumberInput } from '@/components/ui/phone-input';
import { FormNavigation } from '@/components/form/form-navigation';
import { updateApplicationWithGhlId } from '@/lib/services/api-service';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Step1Props {
  onNext: () => void;
}

export function Step1LeadCapture({ onNext }: Step1Props) {
  const { 
    step1, 
    step2,
    updateStep1, 
    setGhlContactId, 
    setGhlOpportunityId, 
    ghlContactId,
    ghlOpportunityId,
    applicationId,
    createNewApplication,
    clearError
  } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: {
      first_name: step1.first_name,
      last_name: step1.last_name,
      email: step1.email,
      mobile: step1.mobile,
    },
  });

  // Reset form when step1 data changes (e.g., from localStorage or navigation)
  useEffect(() => {
    form.reset({
      first_name: step1.first_name,
      last_name: step1.last_name,
      email: step1.email,
      mobile: step1.mobile,
    });
  }, [step1, form]);

  const onSubmit = async (data: Step1FormData) => {
    setIsSubmitting(true);
    clearError(); // Clear any previous errors
    
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

      // Check for database sync errors after the update completes
      const currentState = useFormStore.getState();
      if (currentState.lastError) {
        console.error('Database sync error:', currentState.lastError);
        // Continue with GHL integration but show warning
        toast.error('Database sync warning', {
          description: 'Data saved locally but may not be synced to server',
        });
      }
      
      // Always sync with GHL (create or update contact)
      try {
        // Combine step1 data with date_of_birth from step2 for GHL sync
        const ghlData = {
          ...data,
          date_of_birth: step2.date_of_birth, // Get date_of_birth from step2
          applicationId
        };

        const response = await fetch('/api/gohigh/create-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ghlData),
        });

        const result = await response.json();

        if (result.success && result.contactId) {
          console.log('🎯 GHL integration result:', result);
          
          // Update contact ID in store if not already set
          if (!ghlContactId) {
            console.log('💾 Setting GHL Contact ID:', result.contactId);
            setGhlContactId(result.contactId);
          }
          if (result.opportunityId && !ghlOpportunityId) {
            console.log('💾 Setting GHL Opportunity ID:', result.opportunityId);
            setGhlOpportunityId(result.opportunityId);
          }

          // Save GHL IDs to Supabase 
          if (currentApplicationId) {
            console.log('💾 Saving GHL IDs to database:', { 
              applicationId: currentApplicationId, 
              contactId: result.contactId, 
              opportunityId: result.opportunityId 
            });
            try {
              const updateResult = await updateApplicationWithGhlId(
                currentApplicationId,
                result.contactId,
                result.opportunityId
              );
              
              if (updateResult.error) {
                console.error('❌ Failed to update application with GHL ID:', updateResult.error);
                // Don't block the flow, just log the error
              } else {
                console.log('✅ Successfully saved GHL IDs to database');
              }
            } catch (error) {
              console.error('❌ Error updating application with GHL ID:', error);
              // Don't block the flow
            }
          } else {
            console.warn('⚠️ No application ID found - cannot save GHL IDs to database');
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
      
      // Debug: Check final state before proceeding
      const finalState = useFormStore.getState();
      console.log('🔍 Step 1 complete - Final GHL state:', { 
        ghlContactId: finalState.ghlContactId, 
        ghlOpportunityId: finalState.ghlOpportunityId 
      });
      
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    // Only show error toast if we're not currently submitting
    if (!isSubmitting) {
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
    }
  };

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
          onNext={form.handleSubmit(onSubmit, onError)} 
          isSubmitting={isSubmitting} 
          showBack={false}

        />
      </form>
    </Form>
  );
}
