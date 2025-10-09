'use client';

import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneNumberInput } from '@/components/ui/phone-input';
import { NationalityCombobox } from '@/components/ui/nationality-combobox';
import { CoApplicantModal } from '@/components/ui/co-applicant-modal';
import { FormNavigation } from '@/components/form/form-navigation';
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

  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    mode: 'onSubmit', // Only validate on submit
    reValidateMode: 'onSubmit', // Only re-validate on submit
    defaultValues: {
      nationality: step2.nationality || '',
      marital_status: step2.marital_status || undefined,
      telephone: step2.telephone || '',
      has_co_applicants: step2.has_co_applicants,
      co_applicants: step2.co_applicants || [],
    },
  });

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

  const onSubmit = async (data: Step2FormData) => {
    // Transform co_applicants to match Applicant type if needed
    const transformedData = {
      ...data,
      co_applicants: data.co_applicants?.map((coApp, index) => ({
        ...coApp,
        applicant_order: index + 2, // Primary is 1, co-applicants start at 2
      })) || [],
    };
    updateStep2(transformedData);
    onNext();
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">About You</h2>
            <p className="text-muted-foreground mt-1">
              Tell us a bit more about yourself
            </p>
          </div>

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
              <FormItem className="space-y-3">
                <FormLabel>Marital Status *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {maritalStatuses.map((status) => (
                      <FormItem
                        key={status.value}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={status.value} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {status.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
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

        <FormNavigation showSaveForLater={true} />
      </form>
    </Form>
  );
}
