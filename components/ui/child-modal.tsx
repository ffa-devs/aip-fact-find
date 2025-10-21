"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const childSchema = z.object({
  date_of_birth: z.date({ message: 'Child date of birth is required' }),
  same_address_as_primary: z.boolean(),
});

type ChildFormData = z.infer<typeof childSchema>;

interface ChildModalProps {
  onSave: (child: ChildFormData) => void
  editingChild?: ChildFormData & { index?: number }
  trigger?: React.ReactNode
  isCoApplicant?: boolean
  applicantIndex?: number
}

export function ChildModal({ 
  onSave, 
  editingChild, 
  trigger,
  isCoApplicant = false,
  applicantIndex = 0
}: ChildModalProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const form = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    mode: 'onSubmit',
    defaultValues: editingChild ? {
      date_of_birth: editingChild.date_of_birth,
      same_address_as_primary: editingChild.same_address_as_primary || false,
    } : {
      date_of_birth: undefined,
      same_address_as_primary: false,
    },
  })

  const onSubmit = (data: ChildFormData) => {
    onSave(data)
    setOpen(false)
    form.reset()
  }

  const handleClose = () => {
    setOpen(false)
    if (!editingChild) {
      form.reset()
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-2" />
      Add Child
    </Button>
  )

  const childForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Child&apos;s Date of Birth *</FormLabel>
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
                      {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
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

        {/* Only show same address option for co-applicants */}
        {isCoApplicant && applicantIndex > 0 && (
          <FormField
            control={form.control}
            name="same_address_as_primary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Same address as primary applicant
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Check this if the child lives at the same address as the primary applicant
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {editingChild ? 'Update Child' : 'Add Child'}
          </Button>
          {!isDesktop && (
            <DrawerClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DrawerClose>
          )}
        </div>
      </form>
    </Form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? 'Edit Child' : 'Add Child'}
            </DialogTitle>
            <DialogDescription>
              {editingChild 
                ? 'Update the child\'s information below.'
                : 'Enter the child\'s information below.'
              }
            </DialogDescription>
          </DialogHeader>
          {childForm}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || defaultTrigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {editingChild ? 'Edit Child' : 'Add Child'}
          </DrawerTitle>
          <DrawerDescription>
            {editingChild 
              ? 'Update the child\'s information below.'
              : 'Enter the child\'s information below.'
            }
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {childForm}
        </div>
      </DrawerContent>
    </Drawer>
  )
}