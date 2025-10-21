'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step3Schema } from '@/lib/validations/form-schemas';
import { z } from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNavigation } from '@/components/form/form-navigation';
import { NationalityCombobox } from '@/components/ui/nationality-combobox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ChildModal } from '@/components/ui/child-modal';
import { X, CalendarIcon, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type Step3Data = z.infer<typeof step3Schema>;

interface Step3Props {
  onNext: (formData?: Step3Data) => void;
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
  const getCurrentApplicantData = useCallback(() => {
    if (applicantIndex === 0) {
      return step3; // Primary applicant
    } else {
      const coApplicantIndex = applicantIndex - 1;
      return step3.co_applicants?.[coApplicantIndex] || {
        same_address_as_primary: false,
        current_address: '',
        move_in_date: null,
        homeowner_or_tenant: '',
        monthly_mortgage_or_rent: 0,
        monthly_payment_currency: 'USD',
        current_property_value: 0,
        property_value_currency: 'USD',
        mortgage_outstanding: 0,
        mortgage_outstanding_currency: 'USD',
        lender_or_landlord_details: '',
        previous_address: '',
        previous_move_in_date: null,
        previous_move_out_date: null,
        tax_country: '',
        has_children: false,
        same_children_as_primary: false,
        children: [],
      };
    }
  }, [step3, applicantIndex]);

  const currentData = getCurrentApplicantData();
  const [showChildren, setShowChildren] = useState(currentData.has_children);

  const form = useForm({
    resolver: zodResolver(step3Schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      same_address_as_primary: currentData.same_address_as_primary || false,
      current_address: currentData.current_address,
      move_in_date: currentData.move_in_date 
        ? (currentData.move_in_date instanceof Date ? currentData.move_in_date : new Date(currentData.move_in_date))
        : undefined,
      homeowner_or_tenant: currentData.homeowner_or_tenant as 'homeowner' | 'tenant' | undefined,
      monthly_mortgage_or_rent: currentData.monthly_mortgage_or_rent || 0,
      monthly_payment_currency: 'USD',
      current_property_value: currentData.current_property_value || 0,
      property_value_currency: 'USD',
      mortgage_outstanding: currentData.mortgage_outstanding || 0,
      mortgage_outstanding_currency: 'USD',
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
      same_children_as_primary: applicantIndex > 0 ? (currentData as { same_children_as_primary?: boolean }).same_children_as_primary || false : false,
      children: currentData.children?.map(child => ({
        ...child,
        date_of_birth: child.date_of_birth instanceof Date 
          ? child.date_of_birth 
          : child.date_of_birth 
            ? new Date(child.date_of_birth) 
            : undefined
      })) || [],
    },
  });

  // Reset form when currentData changes (e.g., from localStorage or applicant selection)
  useEffect(() => {
    const currentData = getCurrentApplicantData();
    form.reset({
      same_address_as_primary: currentData.same_address_as_primary || false,
      current_address: currentData.current_address,
      move_in_date: currentData.move_in_date 
        ? (currentData.move_in_date instanceof Date ? currentData.move_in_date : new Date(currentData.move_in_date))
        : undefined,
      homeowner_or_tenant: currentData.homeowner_or_tenant as 'homeowner' | 'tenant' | undefined,
      monthly_mortgage_or_rent: currentData.monthly_mortgage_or_rent || 0,
      monthly_payment_currency: 'USD',
      current_property_value: currentData.current_property_value || 0,
      property_value_currency: 'USD',
      mortgage_outstanding: currentData.mortgage_outstanding || 0,
      mortgage_outstanding_currency: 'USD',
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
        date_of_birth: child.date_of_birth instanceof Date 
          ? child.date_of_birth 
          : child.date_of_birth 
            ? new Date(child.date_of_birth) 
            : undefined
      })) || [],
    });
  }, [step3, applicantIndex, step2, form, getCurrentApplicantData]);

  // Prefill tax_country with nationality when nationality changes
  useEffect(() => {
    if (step2.nationality && !form.getValues('tax_country')) {
      form.setValue('tax_country', step2.nationality);
    }
  }, [step2.nationality, form]);

  const onSubmit = async (data: Step3Data) => {
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

  const addChild = (childData: { date_of_birth: Date; same_address_as_primary: boolean }) => {
    const currentChildren = form.getValues('children') || [];
    form.setValue('children', [...currentChildren, childData]);
  };

  const updateChild = (index: number, childData: { date_of_birth: Date; same_address_as_primary: boolean }) => {
    const currentChildren = form.getValues('children') || [];
    currentChildren[index] = childData;
    form.setValue('children', [...currentChildren]);
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
          {/* Current Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Same Address Checkbox - Only show for co-applicants */}
              {isMultiApplicant && applicantIndex > 0 && (
                <FormField
                  control={form.control}
                  name="same_address_as_primary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              // Prefill with primary applicant's address data
                              const primaryData = step3;
                              form.setValue('current_address', primaryData.current_address || '');
                              if (primaryData.move_in_date) {
                                form.setValue('move_in_date', primaryData.move_in_date instanceof Date ? primaryData.move_in_date : new Date(primaryData.move_in_date));
                              }
                              form.setValue('previous_address', primaryData.previous_address || '');
                              if (primaryData.previous_move_in_date) {
                                form.setValue('previous_move_in_date', primaryData.previous_move_in_date instanceof Date ? primaryData.previous_move_in_date : new Date(primaryData.previous_move_in_date));
                              }
                              if (primaryData.previous_move_out_date) {
                                form.setValue('previous_move_out_date', primaryData.previous_move_out_date instanceof Date ? primaryData.previous_move_out_date : new Date(primaryData.previous_move_out_date));
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Same address as primary applicant
                        </FormLabel>
                        <FormDescription>
                          Check this if you live at the same address as the primary applicant
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="current_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main Street, City, Country" 
                        {...field}
                        disabled={isMultiApplicant && applicantIndex > 0 && form.watch('same_address_as_primary')}
                      />
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
                            disabled={isMultiApplicant && applicantIndex > 0 && form.watch('same_address_as_primary')}
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
                            onValueChange={field.onChange}
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
            <CardContent className="space-y-2">
              <FormField
                control={form.control}
                name="has_children"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Do you have any children or others who rely on your income?<span className="text-muted-foreground">(excluding independent adults)</span></FormLabel>
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

              {/* Same Children as Primary - Only show for co-applicants */}
              {isMultiApplicant && applicantIndex > 0 && (
                <FormField
                  control={form.control}
                  name="same_children_as_primary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              // If same children as primary, copy primary's children and set has_children to primary's value
                              const primaryData = step3;
                              form.setValue('has_children', primaryData.has_children);
                              setShowChildren(primaryData.has_children);
                              if (primaryData.has_children && primaryData.children) {
                                form.setValue('children', [...primaryData.children]);
                              } else {
                                form.setValue('children', []);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Same children as primary applicant
                        </FormLabel>
                        <FormDescription>
                          Check this if you share the same children as the primary applicant
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {showChildren && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Children</h3>
                    {/* Only show Add Child button if not using same children as primary */}
                    {!(isMultiApplicant && applicantIndex > 0 && form.watch('same_children_as_primary')) && (
                      <ChildModal
                        onSave={addChild}
                        isCoApplicant={isMultiApplicant}
                        applicantIndex={applicantIndex}
                      />
                    )}
                  </div>

                  {/* Show message when using same children as primary */}
                  {isMultiApplicant && applicantIndex > 0 && form.watch('same_children_as_primary') && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Using the same children as the primary applicant. To modify children, uncheck &quot;Same children as primary applicant&quot; above.
                      </p>
                    </div>
                  )}

                  {/* Children List */}
                  {watchedChildren?.map((child, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          Child {index + 1}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Born: {child.date_of_birth ? format(child.date_of_birth, 'PPP') : 'Not set'}
                          {isMultiApplicant && applicantIndex > 0 && child.same_address_as_primary && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Same address as primary
                            </span>
                          )}
                          {isMultiApplicant && applicantIndex > 0 && form.watch('same_children_as_primary') && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              From primary applicant
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* Only show edit/delete if not using same children as primary */}
                        {!(isMultiApplicant && applicantIndex > 0 && form.watch('same_children_as_primary')) && (
                          <>
                            <ChildModal
                              editingChild={{ 
                                ...child, 
                                index,
                                same_address_as_primary: child.same_address_as_primary || false
                              }}
                              onSave={(updatedChild) => updateChild(index, updatedChild)}
                              isCoApplicant={isMultiApplicant}
                              applicantIndex={applicantIndex}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChild(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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

        {!hideNavigation && <FormNavigation onNext={() => {}} useSubmitButton={true} />}
      </form>
    </Form>
  );
}