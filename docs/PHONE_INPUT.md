# Phone Number Input Component

## Overview

The phone number input uses **`react-phone-number-input`** library with full international support.

## Features

✅ **International phone numbers** with country codes  
✅ **Country flag dropdown** with automatic detection  
✅ **Auto-formatting** as you type  
✅ **Validation** using `libphonenumber-js`  
✅ **Country detection** from phone number  
✅ **Styled to match shadcn/ui** theme

## Installation

Already installed:
```bash
npm install react-phone-number-input libphonenumber-js
```

## Usage

### Basic Example

```tsx
import { PhoneNumberInput } from '@/components/ui/phone-input';

<FormField
  control={form.control}
  name="mobile"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Mobile Number</FormLabel>
      <FormControl>
        <PhoneNumberInput
          placeholder="+34 123 456 789"
          defaultCountry="ES"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### How It Works

1. **Default Country**: Sets to Spain (`ES`) by default
2. **Auto-detect**: Changes country flag based on typed number
3. **Format**: Automatically formats number as you type
4. **Validate**: Validates using `libphonenumber-js`

### Validation

The Zod schema uses `isValidPhoneNumber()` from `libphonenumber-js`:

```typescript
import { isValidPhoneNumber } from 'libphonenumber-js';

mobile: z
  .string()
  .min(1, 'Mobile number is required')
  .refine((val) => isValidPhoneNumber(val), {
    message: 'Invalid phone number',
  })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Phone number in E.164 format |
| `onChange` | `(value?: string) => void` | - | Callback when value changes |
| `defaultCountry` | `Country` | `'ES'` | Default country code (ISO 3166-1 alpha-2) |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |

### Country Codes

Common codes for your use case:
- `'ES'` - Spain 🇪🇸
- `'GB'` - United Kingdom 🇬🇧
- `'FR'` - France 🇫🇷
- `'DE'` - Germany 🇩🇪
- `'IT'` - Italy 🇮🇹
- `'PT'` - Portugal 🇵🇹

See full list: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

## Features in Action

### 1. Country Auto-Detection
```
User types: +44 20 7946 0958
→ Country automatically changes to 🇬🇧 UK
```

### 2. Auto-Formatting
```
User types: 34612345678
→ Displays as: +34 612 34 56 78
```

### 3. Validation
```
User types: +34 123
→ Shows error: "Invalid phone number"

User types: +34 612 345 678
→ Valid ✓
```

## Styling

The component is styled to match shadcn/ui:
- Uses same border, focus ring, and sizing
- Dark mode support
- Responsive design
- Accessible keyboard navigation

Custom styles added to `app/globals.css`:
```css
/* Phone Input Styles */
.PhoneInput {
  display: flex;
  align-items: center;
}

.PhoneInputInput {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
}

.PhoneInputCountryIcon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}
```

## Usage in Form Steps

### Step 1: Mobile Number (Required)
```tsx
<PhoneNumberInput
  placeholder="+34 123 456 789"
  defaultCountry="ES"
  {...field}
/>
```

### Step 2: Telephone (Optional)
```tsx
<PhoneNumberInput
  placeholder="+34 123 456 789"
  defaultCountry="ES"
  {...field}
/>
```

### Co-applicants
Co-applicant phone numbers also use the same component with validation.

## Data Format

### Stored Format
Phone numbers are stored in **E.164 format**:
```
+34612345678
```

### Display Format
Users see it formatted:
```
+34 612 34 56 78
```

### Database
Store as `VARCHAR(20)` or `TEXT` in Supabase:
```sql
mobile VARCHAR(20) NOT NULL,
telephone VARCHAR(20),
```

## Accessibility

- ✅ Proper ARIA labels
- ✅ Keyboard navigation (Tab to focus, Arrow keys for country)
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Error announcements

## Troubleshooting

### Phone number not validating?
Make sure the number includes country code:
```
✗ 612 345 678
✓ +34 612 345 678
```

### Country not auto-detecting?
Type the full country code first:
```
+44 → Switches to UK
+33 → Switches to France
+49 → Switches to Germany
```

### Want to change default country?
Update in component:
```tsx
defaultCountry="GB" // United Kingdom
defaultCountry="FR" // France
```

## Resources

- [react-phone-number-input](https://github.com/catamphetamine/react-phone-number-input)
- [libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js)
- [Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

## Examples

### Valid Phone Numbers

```
Spain:          +34 612 34 56 78
UK:             +44 20 7946 0958
France:         +33 1 42 86 82 00
Germany:        +49 30 123456
Italy:          +39 02 1234 5678
Portugal:       +351 21 123 4567
USA:            +1 (202) 555-0123
```

### Integration with GHL

When sending to GoHighLevel:
```typescript
const contactData = {
  phone: form.mobile,        // +34612345678 (E.164)
  firstName: form.first_name,
  lastName: form.last_name,
  // ...
};
```

GHL will accept and format the E.164 number correctly.
