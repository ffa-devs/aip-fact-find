"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { isValidPhoneNumber } from "libphonenumber-js"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NationalityCombobox } from "@/components/ui/nationality-combobox"
import { PhoneNumberInput } from "@/components/ui/phone-input"

// Co-applicant form schema
const coApplicantSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
  date_of_birth: z.date({
    message: 'Date of birth is required',
  }),
  nationality: z.string().min(1, 'Nationality is required'),
  marital_status: z.enum(['single', 'married', 'civil_partnership', 'divorced', 'widowed'], {
    message: 'Please select marital status',
  }),
})

type CoApplicantFormData = z.infer<typeof coApplicantSchema>

interface CoApplicantModalProps {
  onSave: (coApplicant: CoApplicantFormData) => void
  editingCoApplicant?: CoApplicantFormData & { index?: number }
  trigger?: React.ReactNode
}

export function CoApplicantModal({ 
  onSave, 
  editingCoApplicant, 
  trigger 
}: CoApplicantModalProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const form = useForm<CoApplicantFormData>({
    resolver: zodResolver(coApplicantSchema),
    mode: 'onSubmit', // Only validate on submit
    defaultValues: editingCoApplicant ? {
      first_name: editingCoApplicant.first_name || '',
      last_name: editingCoApplicant.last_name || '',
      email: editingCoApplicant.email || '',
      mobile: editingCoApplicant.mobile || '',
      date_of_birth: editingCoApplicant.date_of_birth,
      nationality: editingCoApplicant.nationality || '',
      marital_status: editingCoApplicant.marital_status,
    } : {
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      date_of_birth: undefined,
      nationality: '',
      marital_status: undefined,
    },
  })

  const onSubmit = (data: CoApplicantFormData) => {
    onSave(data)
    setOpen(false)
    form.reset()
  }

  const handleClose = () => {
    setOpen(false)
    if (!editingCoApplicant) {
      form.reset()
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-2" />
      Add Co-Applicant
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
              {editingCoApplicant ? 'Edit Co-Applicant' : 'Add Co-Applicant'}
            </DialogTitle>
            <DialogDescription>
              {editingCoApplicant 
                ? 'Update the co-applicant details below.'
                : 'Add a co-applicant to your mortgage application. Click save when you\'re done.'
              }
            </DialogDescription>
          </DialogHeader>
          <CoApplicantForm 
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
            {editingCoApplicant ? 'Edit Co-Applicant' : 'Add Co-Applicant'}
          </DrawerTitle>
          <DrawerDescription>
            {editingCoApplicant 
              ? 'Update the co-applicant details below.'
              : 'Add a co-applicant to your mortgage application. Click save when you\'re done.'
            }
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4">
          <CoApplicantForm 
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

interface CoApplicantFormProps {
  form: ReturnType<typeof useForm<CoApplicantFormData>>
  onSubmit: (data: CoApplicantFormData) => void
  onCancel: () => void
  isDesktop: boolean
}

function CoApplicantForm({ form, onSubmit, onCancel, isDesktop }: CoApplicantFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mobile */}
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number *</FormLabel>
              <FormControl>
                <PhoneNumberInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter mobile number"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
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
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nationality */}
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
                  placeholder="Select nationality"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Marital Status */}
        <FormField
          control={form.control}
          name="marital_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Single</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="married" id="married" />
                    <Label htmlFor="married">Married</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="civil_partnership" id="civil_partnership" />
                    <Label htmlFor="civil_partnership">Civil Partnership</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="divorced" id="divorced" />
                    <Label htmlFor="divorced">Divorced</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="widowed" id="widowed" />
                    <Label htmlFor="widowed">Widowed</Label>
                  </div>
                </RadioGroup>
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
            Save Co-Applicant
          </Button>
        </div>
      </form>
    </Form>
  )
}