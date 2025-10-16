'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step4Schema, Step4FormData } from '@/lib/validations/form-schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FormNavigation } from '@/components/form/form-navigation';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Step4Props {
  onNext: (formData?: Step4FormData) => void;
  applicantIndex?: number;
  isMultiApplicant?: boolean;
  hideNavigation?: boolean;
}

const employmentStatuses = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'director', label: 'Employed Company Director' },
  { value: 'retired_pension', label: 'Retired Pension' },
  { value: 'home_maker', label: 'Home Maker' },
  { value: 'other', label: 'Other' },
] as const;

export function Step4Employment({ 
  onNext, 
  applicantIndex = 0, 
  isMultiApplicant = false,
  hideNavigation = false 
}: Step4Props) {
  const { step4, updateStep4 } = useFormStore();
  
  // Get current applicant data
  const getCurrentApplicantData = () => {
    if (applicantIndex === 0) {
      return step4; // Primary applicant
    } else {
      const coApplicantIndex = applicantIndex - 1;
      return step4.co_applicants?.[coApplicantIndex] || {
        employment_status: '',
        employment_details: {},
        financial_commitments: {},
      };
    }
  };

  const currentData = getCurrentApplicantData();

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      employment_status: currentData.employment_status || 'employed',
      // Employed fields
      job_title: currentData.employment_details?.job_title || '',
      employer_name: currentData.employment_details?.employer_name || '',
      employer_address: currentData.employment_details?.employer_address || '',
      gross_annual_salary: currentData.employment_details?.gross_annual_salary || 0,
      net_monthly_income: currentData.employment_details?.net_monthly_income || 0,
      employment_start_date: currentData.employment_details?.employment_start_date 
        ? new Date(currentData.employment_details.employment_start_date) 
        : undefined,
      previous_employment_details: currentData.employment_details?.previous_employment_details || '',
      // Self-employed/Director fields
      business_name: currentData.employment_details?.business_name || '',
      business_address: currentData.employment_details?.business_address || '',
      business_website: currentData.employment_details?.business_website || '',
      company_creation_date: currentData.employment_details?.company_creation_date 
        ? new Date(currentData.employment_details.company_creation_date) 
        : undefined,
      total_gross_annual_income: currentData.employment_details?.total_gross_annual_income || 0,
      net_annual_income: currentData.employment_details?.net_annual_income || 0,
      company_stake_percentage: currentData.employment_details?.company_stake_percentage || 0,
      bonus_overtime_commission_details: currentData.employment_details?.bonus_overtime_commission_details || '',
      accountant_can_provide_info: currentData.employment_details?.accountant_can_provide_info || false,
      accountant_contact_details: currentData.employment_details?.accountant_contact_details || '',
      // Financial commitments
      personal_loans: currentData.financial_commitments?.personal_loans || 0,
      credit_card_debt: currentData.financial_commitments?.credit_card_debt || 0,
      car_loans_lease: currentData.financial_commitments?.car_loans_lease || 0,
      has_credit_or_legal_issues: currentData.financial_commitments?.has_credit_or_legal_issues || false,
      credit_legal_issues_details: currentData.financial_commitments?.credit_legal_issues_details || '',
    },
  });

  const watchedEmploymentStatus = form.watch('employment_status');
  const watchedAccountantInfo = form.watch('accountant_can_provide_info');

  const onSubmit = async (data: Step4FormData) => {
    if (isMultiApplicant) {
      // For multi-applicant mode, pass data to parent handler
      onNext(data);
    } else {
      // For single applicant mode, transform and update store
      const formData = {
        employment_status: data.employment_status,
        employment_details: {
          job_title: data.job_title,
          employer_name: data.employer_name,
          employer_address: data.employer_address,
          gross_annual_salary: data.gross_annual_salary,
          net_monthly_income: data.net_monthly_income,
          employment_start_date: data.employment_start_date,
          previous_employment_details: data.previous_employment_details,
          business_name: data.business_name,
          business_address: data.business_address,
          business_website: data.business_website,
          company_creation_date: data.company_creation_date,
          total_gross_annual_income: data.total_gross_annual_income,
          net_annual_income: data.net_annual_income,
          company_stake_percentage: data.company_stake_percentage,
          bonus_overtime_commission_details: data.bonus_overtime_commission_details,
          accountant_can_provide_info: data.accountant_can_provide_info,
          accountant_contact_details: data.accountant_contact_details,
        },
        financial_commitments: {
          personal_loans: data.personal_loans,
          credit_card_debt: data.credit_card_debt,
          car_loans_lease: data.car_loans_lease,
          has_credit_or_legal_issues: data.has_credit_or_legal_issues,
          credit_legal_issues_details: data.credit_legal_issues_details,
        },
      };

      updateStep4(formData);
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

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Employment & Income</h2>
            <p className="text-muted-foreground mt-1">
              Tell us about your employment and financial situation
            </p>
          </div>

          {/* Employment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="employment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 md:grid-cols-3 gap-3"
                      >
                        {employmentStatuses.map((status) => (
                          <div key={status.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={status.value} id={status.value} />
                            <Label htmlFor={status.value} className="cursor-pointer">
                              {status.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Employed Form */}
          {watchedEmploymentStatus === 'employed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="employer_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full employer address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gross_annual_salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gross Annual Salary *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="net_monthly_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Monthly Income *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="employment_start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Employment Start Date *</FormLabel>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previous_employment_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Employment Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about previous employment if relevant..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Self-Employed Form */}
          {watchedEmploymentStatus === 'self_employed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Self-Employed Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full business address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="business_website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-website.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_creation_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Company Creation Date *</FormLabel>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total_gross_annual_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Gross Annual Income *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="net_annual_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Annual Income *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accountant_can_provide_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Can Your Accountant Provide Us With Additional Information?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value ? 'yes' : 'no'}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="accountant_yes" />
                            <Label htmlFor="accountant_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="accountant_no" />
                            <Label htmlFor="accountant_no">No, I submit my own tax declarations</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedAccountantInfo && (
                  <FormField
                    control={form.control}
                    name="accountant_contact_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accountant Contact Details</FormLabel>
                        <FormControl>
                          <Input placeholder="Accountant name, phone, email, address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Company Director Form */}
          {watchedEmploymentStatus === 'director' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Director Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full company address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company_creation_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Company Creation Date *</FormLabel>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total_gross_annual_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Gross Annual Income *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="net_annual_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Annual Income *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value || 0}
                            onValueChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company_stake_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage Stake in Company *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="25"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonus_overtime_commission_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus/Overtime/Commission Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Details about additional compensation..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountant_can_provide_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Can Your Accountant Provide Us With Additional Information?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value ? 'yes' : 'no'}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="director_accountant_yes" />
                            <Label htmlFor="director_accountant_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="director_accountant_no" />
                            <Label htmlFor="director_accountant_no">No, I submit my own tax declarations</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedAccountantInfo && (
                  <FormField
                    control={form.control}
                    name="accountant_contact_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accountant Contact Details</FormLabel>
                        <FormControl>
                          <Input placeholder="Accountant name, phone, email, address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Financial Commitments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Commitments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="personal_loans"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Loans</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credit_card_debt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Card Debt</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="car_loans_lease"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Loans/Lease</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="has_credit_or_legal_issues"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Do you have any credit or legal issues?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('has_credit_or_legal_issues') && (
                <FormField
                  control={form.control}
                  name="credit_legal_issues_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any credit or legal issues..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {!hideNavigation && <FormNavigation onNext={() => form.handleSubmit(onSubmit, onError)()} />}
        </div>
      </form>
    </Form>
  );
}