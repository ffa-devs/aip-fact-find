'use client';

import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step2Schema, Step2FormData } from '@/lib/validations/form-schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormNavigation } from '@/components/form/form-navigation';
import { PhoneNumberInput } from '@/components/ui/phone-input';
import { NationalityCombobox } from '@/components/ui/nationality-combobox';
import { CoApplicantModal } from '@/components/ui/co-applicant-modal';

import { Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { parsePhoneNumber } from 'react-phone-number-input';

interface Step2Props {
  onNext: () => void;
}

const maritalStatuses = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'civil_partnership', label: 'Civil Partnership' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export function Step2AboutYou({ onNext }: Step2Props) {
  const { step1, step2, updateStep2 } = useFormStore();
  const [showCoApplicant, setShowCoApplicant] = useState(step2.has_co_applicants);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step2FormData>({
    resolver: async (values, context, options) => {
      // Convert date fields in co_applicants to Date objects if they're strings
      const processedValues = {
        ...values,
        co_applicants: values.co_applicants?.map(coApp => ({
          ...coApp,
          date_of_birth: coApp.date_of_birth instanceof Date 
            ? coApp.date_of_birth 
            : typeof coApp.date_of_birth === 'string'
            ? new Date(coApp.date_of_birth)
            : coApp.date_of_birth,
        })) || [],
      };
      return zodResolver(step2Schema)(processedValues, context, options);
    },
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change
    defaultValues: {
      nationality: step2.nationality || '',
      marital_status: step2.marital_status || undefined,
      telephone: step2.telephone || '',
      has_co_applicants: step2.has_co_applicants,
      co_applicants: step2.co_applicants?.map(coApp => ({
        ...coApp,
        date_of_birth: coApp.date_of_birth instanceof Date 
          ? coApp.date_of_birth 
          : typeof coApp.date_of_birth === 'string' 
          ? new Date(coApp.date_of_birth)
          : coApp.date_of_birth,
      })) || [],
    },
  });

  // Reset form when step2 data changes (e.g., from localStorage or navigation)
  useEffect(() => {
    form.reset({
      nationality: step2.nationality || '',
      marital_status: step2.marital_status || undefined,
      telephone: step2.telephone || '',
      has_co_applicants: step2.has_co_applicants,
      co_applicants: step2.co_applicants?.map(coApp => ({
        ...coApp,
        date_of_birth: coApp.date_of_birth instanceof Date 
          ? coApp.date_of_birth 
          : typeof coApp.date_of_birth === 'string' 
          ? new Date(coApp.date_of_birth)
          : coApp.date_of_birth,
      })) || [],
    });
  }, [step2, form]);

  // Auto-detect nationality from Step 1 phone number
  useEffect(() => {
    if (step1.mobile && !step2.nationality) {
      try {
        const phoneNumber = parsePhoneNumber(step1.mobile);
        if (phoneNumber?.country) {
          form.setValue('nationality', phoneNumber.country);
        }
      } catch {
        // Invalid phone number, ignore
      }
    }
  }, [step1.mobile, step2.nationality, form]);

  // Sync form with store data on mount (fixes reload issues)
  useEffect(() => {
    if (step2.co_applicants && step2.co_applicants.length > 0) {
      const processedCoApplicants = step2.co_applicants.map(coApp => ({
        first_name: coApp.first_name,
        last_name: coApp.last_name,
        email: coApp.email,
        mobile: coApp.mobile,
        date_of_birth: coApp.date_of_birth instanceof Date 
          ? coApp.date_of_birth 
          : typeof coApp.date_of_birth === 'string' 
          ? new Date(coApp.date_of_birth)
          : coApp.date_of_birth,
        nationality: coApp.nationality || '',
        marital_status: coApp.marital_status || 'single',
      }));
      
      form.setValue('co_applicants', processedCoApplicants);
      form.setValue('has_co_applicants', step2.has_co_applicants);
    }
  }, [step2.co_applicants, step2.has_co_applicants, form]);

  const onSubmit = async (data: Step2FormData) => {
    console.log('Step 2 Form Data:', data);
    setIsSubmitting(true);
    
    try {
      // Transform co_applicants to match Applicant type if needed
      const transformedData = {
        ...data,
        co_applicants: data.co_applicants?.map((coApp, index) => ({
          ...coApp,
          applicant_order: index + 2, // Primary is 1, co-applicants start at 2
        })) || [],
      };
      
      console.log('Step 2 Transformed Data:', transformedData);
      
      // Update with database sync
      await updateStep2(transformedData);
      
      onNext();
    } catch (error) {
      console.error('Error saving Step 2 data:', error);
      // Still proceed to next step even if database sync fails
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: FieldErrors<Step2FormData>) => {
    console.log('Step 2 Validation Errors:', errors);
    console.log('Current form values:', form.getValues());
    console.log('Current step2 store data:', step2);
    
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

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality *</FormLabel>
                <FormControl>
                  <NationalityCombobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select your nationality"
                  />
                </FormControl>
                <FormDescription>
                  {field.value && 'You can change this if needed'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marital_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marital Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your marital status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {maritalStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone Number (Optional)</FormLabel>
                <FormControl>
                  <PhoneNumberInput
                    placeholder="+34 123 456 789"
                    defaultCountry="ES"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Only if different from your mobile number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-6 border-t">
            <FormField
              control={form.control}
              name="has_co_applicants"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Are you applying with anyone else?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        const boolValue = value === 'true';
                        field.onChange(boolValue);
                        setShowCoApplicant(boolValue);
                        
                        // Clear co-applicants if "No, just me" is selected
                        if (!boolValue) {
                          form.setValue('co_applicants', []);
                        }
                      }}
                      defaultValue={field.value ? 'true' : 'false'}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          No, just me
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Yes, with someone else
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showCoApplicant && (
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold">Co-Applicant Details</h4>
                    <CoApplicantModal
                      onSave={(newCoApplicant) => {
                        const currentCoApplicants = form.getValues('co_applicants') || [];
                        form.setValue('co_applicants', [...currentCoApplicants, newCoApplicant]);
                      }}
                    />
                  </div>
                  
                  {/* Co-Applicants List */}
                  <div className="space-y-3">
                    {form.watch('co_applicants')?.map((coApplicant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {coApplicant.first_name} {coApplicant.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {coApplicant.email} • {coApplicant.nationality}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <CoApplicantModal
                            editingCoApplicant={{ ...coApplicant, index }}
                            onSave={(updatedCoApplicant) => {
                              const currentCoApplicants = form.getValues('co_applicants') || [];
                              const updatedCoApplicants = [...currentCoApplicants];
                              updatedCoApplicants[index] = updatedCoApplicant;
                              form.setValue('co_applicants', updatedCoApplicants);
                            }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentCoApplicants = form.getValues('co_applicants') || [];
                              const updatedCoApplicants = currentCoApplicants.filter((_, i) => i !== index);
                              form.setValue('co_applicants', updatedCoApplicants);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <FormNavigation 
          onNext={() => form.handleSubmit(onSubmit, onError)()} 
          isSubmitting={isSubmitting} 
          showSaveForLater={true}
        />
      </form>
    </Form>
  );
}
