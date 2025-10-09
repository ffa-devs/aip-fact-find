'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'CAD', symbol: 'CAD$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AUD$', name: 'Australian Dollar' },
];

interface CurrencyInputProps {
  value?: number;
  currency?: string;
  onValueChange?: (value: number) => void;
  onCurrencyChange?: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  value,
  currency = 'EUR',
  onValueChange,
  onCurrencyChange,
  placeholder = '0',
  disabled = false,
  className,
}: CurrencyInputProps) {
  const [open, setOpen] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState('');

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

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
      {/* Currency Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="rounded-r-none border-r-0 px-3 min-w-[80px]"
          >
            <span className="font-medium">{selectedCurrency.symbol}</span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <div className="max-h-[300px] overflow-y-auto">
            <div className="p-1">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    onCurrencyChange?.(curr.code);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    currency === curr.code && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currency === curr.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[30px]">{curr.symbol}</span>
                    <span className="text-muted-foreground">{curr.code}</span>
                    <span className="text-xs text-muted-foreground">{curr.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

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