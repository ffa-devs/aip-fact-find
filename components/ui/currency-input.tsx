'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value?: number;
  onValueChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  value,
  onValueChange,
  placeholder = '0',
  disabled = false,
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState('');

  // Format number with thousands separators
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Update display value when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(value === 0 ? '' : formatNumber(value));
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only digits and remove any non-digit characters
    const digitsOnly = inputValue.replace(/[^\d]/g, '');
    
    if (digitsOnly === '') {
      setDisplayValue('');
      onValueChange?.(0);
      return;
    }

    const numericValue = parseInt(digitsOnly, 10);
    const formattedValue = formatNumber(numericValue);
    
    setDisplayValue(formattedValue);
    onValueChange?.(numericValue);
  };

  return (
    <div className={cn('flex', className)}>
      {/* Fixed USD Currency Display */}
      <div className="flex items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground min-w-[50px]">
        $
      </div>

      {/* Amount Input */}
      <Input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-l-none flex-1"
      />
    </div>
  );
}