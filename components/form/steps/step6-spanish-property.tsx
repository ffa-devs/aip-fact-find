'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step6Schema, Step6FormData } from '@/lib/validations/form-schemas';
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

import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormNavigation } from '@/components/form/form-navigation';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Step6Props {
  onNext: () => void;
}

export function Step6SpanishProperty({ onNext }: Step6Props) {
  const { step6, updateStep6 } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step6FormData>({
    resolver: zodResolver(step6Schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      urgency_level: step6.urgency_level === '' ? undefined : step6.urgency_level,
      purchase_price: step6.purchase_price || undefined,
      deposit_available: step6.deposit_available || undefined,
      property_address: step6.property_address || '',
      home_status: step6.home_status === '' ? undefined : step6.home_status,
      property_type: step6.property_type === '' ? undefined : step6.property_type,
      real_estate_agent_contact: step6.real_estate_agent_contact || '',
      lawyer_contact: step6.lawyer_contact || '',
      additional_information: step6.additional_information || '',
      authorization_consent: step6.authorization_consent || false,
    },
  });

  // Reset form when step6 data changes (e.g., from localStorage or navigation)
  useEffect(() => {
    form.reset({
      urgency_level: step6.urgency_level === '' ? undefined : step6.urgency_level,
      purchase_price: step6.purchase_price || undefined,
      deposit_available: step6.deposit_available || undefined,
      property_address: step6.property_address || '',
      home_status: step6.home_status === '' ? undefined : step6.home_status,
      property_type: step6.property_type === '' ? undefined : step6.property_type,
      real_estate_agent_contact: step6.real_estate_agent_contact || '',
      lawyer_contact: step6.lawyer_contact || '',
      additional_information: step6.additional_information || '',
      authorization_consent: step6.authorization_consent || false,
    });
  }, [step6, form]);

  const onSubmit = async (data: Step6FormData) => {
    setIsSubmitting(true);
    try {
      // Transform the validated data back to the store format
      const formData = {
        urgency_level: data.urgency_level,
        purchase_price: data.purchase_price,
        deposit_available: data.deposit_available,
        property_address: data.property_address,
        home_status: data.home_status,
        property_type: data.property_type,
        real_estate_agent_contact: data.real_estate_agent_contact,
        lawyer_contact: data.lawyer_contact,
        additional_information: data.additional_information,
        authorization_consent: data.authorization_consent,
      };

      // Update with database sync (final step submission)
      await updateStep6(formData);

      // Complete application in GHL if contact and opportunity exist
      const { ghlContactId, ghlOpportunityId, applicationId } = useFormStore.getState();
      if (ghlContactId && ghlOpportunityId) {
        try {
          // Flatten and map data for GHL final submission
          const ghlData = {
            urgency_level: data.urgency_level,
            aip_purchase_price: data.purchase_price,
            deposit_available: data.deposit_available,
            property_address: data.property_address,
            aip_home_status: data.home_status,
            aip_property_type: data.property_type,
            real_estate_agent_contact: data.real_estate_agent_contact,
            lawyer_contact: data.lawyer_contact,
            additional_information: data.additional_information,
          };

          const response = await fetch('/api/gohigh/update-contact', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactId: ghlContactId,
              opportunityId: ghlOpportunityId,
              step: 6,
              data: ghlData
            }),
          });

          if (!response.ok) {
            console.error('Failed to complete application in GHL');
          } else {
            console.log('✅ Application completed successfully in GHL');
          }

          // Create co-applicant records in GHL if any exist
          const formState = useFormStore.getState();
          if (formState.step2.co_applicants && formState.step2.co_applicants.length > 0 && applicationId) {
            console.log('👥 Creating co-applicant records in GoHighLevel...');
            
            try {
              const coApplicantResponse = await fetch('/api/gohigh/create-co-applicants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicationId,
                  formState,
                  contactId: ghlContactId
                }),
              });

              const coApplicantResult = await coApplicantResponse.json();

              if (coApplicantResponse.ok && coApplicantResult.success) {
                console.log(`✅ Successfully created ${coApplicantResult.created} co-applicant records`);
                toast.success(`Application and ${coApplicantResult.created} co-applicant record(s) submitted successfully!`);
              } else {
                console.error('❌ Co-applicant records failed:', coApplicantResult.errors || coApplicantResult.error);
                toast.warning('Application submitted, but some co-applicant records may need manual review');
              }
            } catch (coApplicantError) {
              console.error('❌ Co-applicant record creation failed:', coApplicantError);
              toast.warning('Application submitted, but co-applicant records may need manual review');
            }
          } else {
            toast.success('Application submitted successfully!');
          }

        } catch (error) {
          console.error('Error completing application in GHL:', error);
        }
      } else {
        toast.success('Application submitted successfully!');
      }
      
      onNext();
    } catch (error) {
      console.error('Error saving Step 6 data:', error);
      toast.error('Error submitting application', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsSubmitting(false);
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
          {/* Level of Urgency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Level of Urgency</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="urgency_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please Select *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Please Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent (found a property)</SelectItem>
                        <SelectItem value="pre_approval">Pre Approval wanted (still looking)</SelectItem>
                        <SelectItem value="general_info">General Information needed</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Property Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price or Re-mortgage Value *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="Enter purchase price"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Money Available for Spanish Property Purchase? *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="Enter deposit amount"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="property_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address of Property to be Mortgaged *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the full property address in Spain"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="home_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main_residence">Main Residence</SelectItem>
                          <SelectItem value="holiday_home">Holiday Home/Lifestyle</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="rustic">Rustic</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="real_estate_agent_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Details of Real Estate Agent</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide the name, phone number, email, and address of your real estate agent"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lawyer_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Details of Lawyer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide the name, phone number, email, and address of your lawyer"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Further Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Further Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="additional_information"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="To gain a deeper understanding of your situation, please provide any additional information or contextual details that may be relevant."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authorization_consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        We also request authorization to offer you products and services related to those requested, executed and/or marketed by our company enabling us to keep you as a client. For further information see below &ldquo;Informative Clause for Clients&rdquo;. *
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <FormNavigation 
            onNext={() => form.handleSubmit(onSubmit, onError)()} 
            isSubmitting={isSubmitting} 
          />
        </div>
      </form>
    </Form>
  );
}