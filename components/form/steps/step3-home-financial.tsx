'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step3Schema, Step3FormData } from '@/lib/validations/form-schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNavigation } from '@/components/form/form-navigation';
import { NationalityCombobox } from '@/components/ui/nationality-combobox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Step3Props {
  onNext: (formData?: Step3FormData) => void;
  applicantIndex?: number;
  isMultiApplicant?: boolean;
  hideNavigation?: boolean;
}

export function Step3HomeFinancial({ 
  onNext, 
  applicantIndex = 0, 
  isMultiApplicant = false,
  hideNavigation = false 
}: Step3Props) {
  const { step2, step3, updateStep3 } = useFormStore();
  
  // Get current applicant data
  const getCurrentApplicantData = () => {
    if (applicantIndex === 0) {
      return step3; // Primary applicant
    } else {
      const coApplicantIndex = applicantIndex - 1;
      return step3.co_applicants?.[coApplicantIndex] || {
        current_address: '',
        move_in_date: null,
        homeowner_or_tenant: '',
        monthly_mortgage_or_rent: 0,
        monthly_payment_currency: 'EUR',
        current_property_value: 0,
        property_value_currency: 'EUR',
        mortgage_outstanding: 0,
        mortgage_outstanding_currency: 'EUR',
        lender_or_landlord_details: '',
        previous_address: '',
        previous_move_in_date: null,
        previous_move_out_date: null,
        tax_country: '',
        has_children: false,
        children: [],
      };
    }
  };

  const currentData = getCurrentApplicantData();
  const [showChildren, setShowChildren] = useState(currentData.has_children);

  const form = useForm<Step3FormData>({
    resolver: async (values, context, options) => {
      // Convert date fields to Date if they're strings
      const processedValues = {
        ...values,
        move_in_date: values.move_in_date instanceof Date 
          ? values.move_in_date 
          : typeof values.move_in_date === 'string'
          ? new Date(values.move_in_date)
          : values.move_in_date,
        previous_move_in_date: values.previous_move_in_date instanceof Date 
          ? values.previous_move_in_date 
          : typeof values.previous_move_in_date === 'string'
          ? new Date(values.previous_move_in_date)
          : values.previous_move_in_date,
        previous_move_out_date: values.previous_move_out_date instanceof Date 
          ? values.previous_move_out_date 
          : typeof values.previous_move_out_date === 'string'
          ? new Date(values.previous_move_out_date)
          : values.previous_move_out_date,
        children: values.children?.map(child => ({
          ...child,
          date_of_birth: child.date_of_birth instanceof Date 
            ? child.date_of_birth 
            : typeof child.date_of_birth === 'string'
            ? new Date(child.date_of_birth)
            : child.date_of_birth,
        })) || [],
      };
      return zodResolver(step3Schema)(processedValues, context, options);
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      current_address: currentData.current_address,
      move_in_date: currentData.move_in_date 
        ? (currentData.move_in_date instanceof Date ? currentData.move_in_date : new Date(currentData.move_in_date))
        : undefined,
      homeowner_or_tenant: currentData.homeowner_or_tenant as 'homeowner' | 'tenant' | undefined,
      monthly_mortgage_or_rent: currentData.monthly_mortgage_or_rent || 0,
      monthly_payment_currency: currentData.monthly_payment_currency || 'EUR',
      current_property_value: currentData.current_property_value || 0,
      property_value_currency: currentData.property_value_currency || 'EUR',
      mortgage_outstanding: currentData.mortgage_outstanding || 0,
      mortgage_outstanding_currency: currentData.mortgage_outstanding_currency || 'EUR',
      lender_or_landlord_details: currentData.lender_or_landlord_details,
      previous_address: currentData.previous_address,
      previous_move_in_date: currentData.previous_move_in_date 
        ? (currentData.previous_move_in_date instanceof Date ? currentData.previous_move_in_date : new Date(currentData.previous_move_in_date))
        : undefined,
      previous_move_out_date: currentData.previous_move_out_date 
        ? (currentData.previous_move_out_date instanceof Date ? currentData.previous_move_out_date : new Date(currentData.previous_move_out_date))
        : undefined,
      tax_country: currentData.tax_country || step2.nationality || '',
      has_children: currentData.has_children,
      children: currentData.children?.map(child => ({
        ...child,
        date_of_birth: child.date_of_birth instanceof Date ? child.date_of_birth : new Date(child.date_of_birth)
      })) || [],
    },
  });

  // Prefill tax_country with nationality when nationality changes
  useEffect(() => {
    if (step2.nationality && !form.getValues('tax_country')) {
      form.setValue('tax_country', step2.nationality);
    }
  }, [step2.nationality, form]);

  const onSubmit = async (data: Step3FormData) => {
    if (isMultiApplicant) {
      // For multi-applicant mode, pass data to parent handler
      onNext(data);
    } else {
      // For single applicant mode, update store and proceed
      updateStep3(data);
      onNext();
    }
  };

  const onError = () => {
    toast.error('Please fill in all required fields correctly', {
      description: 'Check the highlighted fields below',
    });

    setTimeout(() => {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
    }, 100);
  };

  const addChild = () => {
    const currentChildren = form.getValues('children') || [];
    form.setValue('children', [...currentChildren, { date_of_birth: new Date() }]);
  };

  const removeChild = (index: number) => {
    const currentChildren = form.getValues('children') || [];
    form.setValue('children', currentChildren.filter((_, i) => i !== index));
  };

  const watchedChildren = form.watch('children');
  const homeownerStatus = form.watch('homeowner_or_tenant');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Your Home & Financial Position</h2>
            <p className="text-muted-foreground mt-1">
              Tell us about your current living situation and financial commitments
            </p>
          </div>

          {/* Current Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="current_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="move_in_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>When did you move in? *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Select move-in date</span>
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
                            date > new Date() || date < new Date('1950-01-01')
                          }
                          initialFocus
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      We&apos;ll calculate how long you&apos;ve lived here
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="homeowner_or_tenant"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Are you a homeowner or tenant? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="homeowner" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Homeowner
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="tenant" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Tenant
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {homeownerStatus && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="monthly_mortgage_or_rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {homeownerStatus === 'homeowner' ? 'Monthly Mortgage Payment *' : 'Monthly Rent Payment *'}
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            currency={form.getValues('monthly_payment_currency')}
                            onValueChange={field.onChange}
                            onCurrencyChange={(currency) => form.setValue('monthly_payment_currency', currency)}
                            placeholder={homeownerStatus === 'homeowner' ? '2500' : '1500'}
                          />
                        </FormControl>
                        <FormDescription>
                          {homeownerStatus === 'homeowner' 
                            ? 'Enter your monthly mortgage payment amount' 
                            : 'Enter your monthly rent payment amount'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Country */}
          <FormField
            control={form.control}
            name="tax_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Resident Country *</FormLabel>
                <FormControl>
                  <NationalityCombobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select tax country"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Children Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dependents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="has_children"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Do you have any children or dependents?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          const boolValue = value === 'true';
                          field.onChange(boolValue);
                          setShowChildren(boolValue);
                          if (!boolValue) {
                            form.setValue('children', []);
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
                            No
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="true" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Yes
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showChildren && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Children Ages</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChild}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Child
                    </Button>
                  </div>

                  {watchedChildren?.map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`children.${index}.date_of_birth`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Child {index + 1} Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Select date of birth</span>
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
                                    date > new Date() || date < new Date('1990-01-01')
                                  }
                                  initialFocus
                                  captionLayout="dropdown"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show validation error if has_children is true but no children added */}
              {showChildren && (
                <div className="text-sm text-red-600">
                  {form.formState.errors.children?.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!hideNavigation && <FormNavigation showSaveForLater={true} />}
      </form>
    </Form>
  );
}