"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"

// Rental property form schema
const rentalPropertySchema = z.object({
  property_address: z.string().min(1, 'Property address is required'),
  current_valuation: z.number().optional(),
  mortgage_outstanding: z.number().optional(),
  monthly_mortgage_payment: z.number().optional(),
  monthly_rent_received: z.number().optional(),
})

type RentalPropertyFormData = z.infer<typeof rentalPropertySchema>

interface RentalPropertyModalProps {
  onSave: (property: RentalPropertyFormData) => void
  editingProperty?: {
    property_address: string;
    current_valuation?: number;
    mortgage_outstanding?: number;
    monthly_mortgage_payment?: number;
    monthly_rent_received?: number;
    index?: number;
  }
  trigger?: React.ReactNode
}

export function RentalPropertyModal({ 
  onSave, 
  editingProperty, 
  trigger 
}: RentalPropertyModalProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const form = useForm<RentalPropertyFormData>({
    resolver: zodResolver(rentalPropertySchema),
    mode: 'onSubmit', // Only validate on submit
    defaultValues: editingProperty ? {
      property_address: editingProperty.property_address || '',
      current_valuation: editingProperty.current_valuation,
      mortgage_outstanding: editingProperty.mortgage_outstanding,
      monthly_mortgage_payment: editingProperty.monthly_mortgage_payment,
      monthly_rent_received: editingProperty.monthly_rent_received,
    } : {
      property_address: '',
      current_valuation: undefined,
      mortgage_outstanding: undefined,
      monthly_mortgage_payment: undefined,
      monthly_rent_received: undefined,
    },
  })

  const onSubmit = (data: RentalPropertyFormData) => {
    onSave(data)
    setOpen(false)
    form.reset()
  }

  const handleClose = () => {
    setOpen(false)
    if (!editingProperty) {
      form.reset()
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-2" />
      Add Property
    </Button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? 'Edit Rental Property' : 'Add Rental Property'}
            </DialogTitle>
            <DialogDescription>
              {editingProperty 
                ? 'Update the rental property details below.'
                : 'Add a rental property to your portfolio. Click save when you\'re done.'
              }
            </DialogDescription>
          </DialogHeader>
          <RentalPropertyForm 
            form={form} 
            onSubmit={onSubmit} 
            onCancel={handleClose}
            isDesktop={true}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || defaultTrigger}
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {editingProperty ? 'Edit Rental Property' : 'Add Rental Property'}
          </DrawerTitle>
          <DrawerDescription>
            {editingProperty 
              ? 'Update the rental property details below.'
              : 'Add a rental property to your portfolio. Click save when you\'re done.'
            }
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4">
          <RentalPropertyForm 
            form={form} 
            onSubmit={onSubmit} 
            onCancel={handleClose}
            isDesktop={false}
          />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

interface RentalPropertyFormProps {
  form: ReturnType<typeof useForm<RentalPropertyFormData>>
  onSubmit: (data: RentalPropertyFormData) => void
  onCancel: () => void
  isDesktop: boolean
}

function RentalPropertyForm({ form, onSubmit, onCancel, isDesktop }: RentalPropertyFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Address */}
        <FormField
          control={form.control}
          name="property_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Address *</FormLabel>
              <FormControl>
                <Input placeholder="Enter property address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Valuation */}
        <FormField
          control={form.control}
          name="current_valuation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Valuation</FormLabel>
              <FormControl>
                <CurrencyInput
                  placeholder="Enter current property valuation"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mortgage Outstanding */}
          <FormField
            control={form.control}
            name="mortgage_outstanding"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mortgage Outstanding</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="Enter outstanding mortgage"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monthly Mortgage Payment */}
          <FormField
            control={form.control}
            name="monthly_mortgage_payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Mortgage Payment</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="Enter monthly payment"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Monthly Rent Received */}
        <FormField
          control={form.control}
          name="monthly_rent_received"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent Received</FormLabel>
              <FormControl>
                <CurrencyInput
                  placeholder="Enter monthly rent received"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className={cn(
          "flex gap-2",
          isDesktop ? "justify-end" : "flex-col"
        )}>
          {isDesktop && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Save Property
          </Button>
        </div>
      </form>
    </Form>
  )
}