'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '@/lib/store/form-store';
import { step5Schema, Step5FormData } from '@/lib/validations/form-schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RentalPropertyModal } from '@/components/ui/rental-property-modal';
import { FormNavigation } from '@/components/form/form-navigation';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Step5Props {
  onNext: () => void;
}

export function Step5Portfolio({ onNext }: Step5Props) {
  const { step5, updateStep5 } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step5FormData>({
    resolver: zodResolver(step5Schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      has_rental_properties: step5.has_rental_properties || false,
      rental_properties: step5.rental_properties || [],
      other_assets: step5.other_assets || '',
    },
  });

  const watchedHasRentalProperties = form.watch('has_rental_properties');
  const watchedRentalProperties = form.watch('rental_properties') || [];

  // Reset form when step5 data changes (e.g., from localStorage or navigation)
  useEffect(() => {
    form.reset({
      has_rental_properties: step5.has_rental_properties || false,
      rental_properties: step5.rental_properties || [],
      other_assets: step5.other_assets || '',
    });
  }, [step5, form]);

  const onSubmit = async (data: Step5FormData) => {
    setIsSubmitting(true);
    try {
      // Transform the validated data back to the store format
      const formData = {
        has_rental_properties: data.has_rental_properties,
        rental_properties: data.rental_properties || [],
        other_assets: data.other_assets || '',
      };

      // Update with database sync
      await updateStep5(formData);
      onNext();
    } catch (error) {
      console.error('Error saving Step 5 data:', error);
      // Still proceed even if database sync fails
      onNext();
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

  const addRentalProperty = (property: {
    property_address: string;
    current_valuation?: number;
    mortgage_outstanding?: number;
    monthly_mortgage_payment?: number;
    monthly_rent_received?: number;
  }) => {
    const currentProperties = form.getValues('rental_properties') || [];
    form.setValue('rental_properties', [...currentProperties, property]);
  };

  const updateRentalProperty = (index: number, property: {
    property_address: string;
    current_valuation?: number;
    mortgage_outstanding?: number;
    monthly_mortgage_payment?: number;
    monthly_rent_received?: number;
  }) => {
    const currentProperties = form.getValues('rental_properties') || [];
    const updatedProperties = [...currentProperties];
    updatedProperties[index] = property;
    form.setValue('rental_properties', updatedProperties);
  };

  const removeRentalProperty = (index: number) => {
    const currentProperties = form.getValues('rental_properties') || [];
    form.setValue(
      'rental_properties',
      currentProperties.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">

          {/* Rental Properties Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rental Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="has_rental_properties"
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
                        Do you currently own any rental properties?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchedHasRentalProperties && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Property Details</h3>
                    <RentalPropertyModal onSave={addRentalProperty} />
                  </div>

                  {watchedRentalProperties.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No rental properties added yet.</p>
                      <p className="text-sm">Click &ldquo;Add Property&rdquo; to get started.</p>
                    </div>
                  )}

                  {watchedRentalProperties.map((property, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            Property {index + 1}
                          </CardTitle>
                          <div className="flex gap-2">
                            <RentalPropertyModal
                              onSave={(updatedProperty) => updateRentalProperty(index, updatedProperty)}
                              editingProperty={property}
                              trigger={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRentalProperty(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Address:</span> {property.property_address}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Valuation:</span> £{property.current_valuation?.toLocaleString() || '0'}
                            </div>
                            <div>
                              <span className="font-medium">Outstanding:</span> £{property.mortgage_outstanding?.toLocaleString() || '0'}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Monthly Payment:</span> £{property.monthly_mortgage_payment?.toLocaleString() || '0'}
                            </div>
                            <div>
                              <span className="font-medium">Monthly Rent:</span> £{property.monthly_rent_received?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Assets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Other Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="other_assets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Assets & Savings (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe any other significant assets such as savings accounts, investments, stocks, bonds, vehicles, jewelry, etc. Include estimated values where possible."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
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