'use client';

import * as React from 'react';
import PhoneInput, { Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value?: string) => void;
  defaultCountry?: Country;
}

const PhoneNumberInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, defaultCountry = 'ES', ...props }, ref) => {
    return (
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={(val) => onChange?.(val)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        numberInputProps={{
          className: cn(
            'flex h-10 w-full rounded-md border-0 bg-transparent px-0 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
            'placeholder:text-muted-foreground focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50'
          ),
          ref,
          ...props,
        }}
        countrySelectProps={{
          className: 'mr-2',
        }}
      />
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';

export { PhoneNumberInput };
