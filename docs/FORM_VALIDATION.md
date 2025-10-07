# Form Validation Guide

## Overview

The AIP Fact Find form has comprehensive validation with visual feedback to ensure users provide all required information correctly.

---

## ✅ Validation Features

### 1. **Real-time Validation**
- **On Blur**: Validates when user leaves a field
- **On Change**: Re-validates as user types (after first validation)
- **On Submit**: Validates all fields when clicking "Continue"

### 2. **Visual Feedback**

#### Red Border & Error Message
When a field is invalid:
```
✗ Field shows RED border
✗ Error message appears below field
✗ Field label turns red
```

#### Success State
When a field is valid:
```
✓ Normal border color
✓ No error message
✓ Normal label color
```

### 3. **Submit Validation**
When user clicks "Continue" with errors:
- ❌ **Red borders** appear on all invalid fields
- ❌ **Error messages** show specific validation failures
- 🔔 **Toast notification** appears: "Please fill in all required fields correctly"
- 📜 **Auto-scroll** to first error field
- 🎯 **Auto-focus** on first error field

---

## 📋 Step 1: Lead Capture Validation

### Required Fields

| Field | Validation Rules | Error Messages |
|-------|-----------------|----------------|
| **First Name** | • Min 1 character | "First name is required" |
| **Last Name** | • Min 1 character | "Last name is required" |
| **Date of Birth** | • Must be a valid date<br>• Cannot be in future<br>• Must be after 1900 | "Date of birth is required" |
| **Email** | • Valid email format | "Invalid email address" |
| **Mobile** | • Valid international phone number<br>• Uses libphonenumber-js | "Mobile number is required"<br>"Invalid phone number" |

### Visual States

#### Empty Field (Not Touched)
```
┌─────────────────────┐
│ John                │  ← Normal border
└─────────────────────┘
```

#### Error State (After Blur/Submit)
```
┌─────────────────────┐
│                     │  ← RED border
└─────────────────────┘
❌ First name is required
```

#### Valid State
```
┌─────────────────────┐
│ John Smith          │  ← Normal border
└─────────────────────┘
```

---

## 📋 Step 2: About You Validation

### Required Fields

| Field | Validation Rules | Error Messages |
|-------|-----------------|----------------|
| **Nationality** | • Must select from dropdown | "Nationality is required" |
| **Marital Status** | • Must select one option | "Please select your marital status" |
| **Telephone** | • OPTIONAL<br>• If provided, must be valid phone number | "Invalid phone number" |

### Optional Fields

- **Telephone Number**: Only validated if user enters something
- **Co-applicants**: Only required if toggle is enabled

---

## 🎨 Visual Design

### Error Colors

**Light Mode:**
```css
Border:      hsl(var(--destructive))      /* Red */
Ring:        hsl(var(--destructive) / 20%) /* Light red glow */
Text:        hsl(var(--destructive))      /* Red text */
```

**Dark Mode:**
```css
Border:      hsl(var(--destructive))      /* Red */
Ring:        hsl(var(--destructive) / 40%) /* Brighter red glow */
Text:        hsl(var(--destructive))      /* Red text */
```

### CSS Classes

All invalid fields automatically get:
```html
<input aria-invalid="true" class="border-destructive" />
```

Custom CSS enhances this:
```css
[aria-invalid="true"] {
  @apply border-destructive;
}

[aria-invalid="true"]:focus {
  @apply ring-destructive/20 border-destructive;
}
```

---

## 🔧 Technical Implementation

### Form Configuration

```typescript
const form = useForm<Step1FormData>({
  resolver: zodResolver(step1Schema),
  mode: 'onBlur',              // Validate when user leaves field
  reValidateMode: 'onChange',   // Re-validate as user types after error
  defaultValues: { ... },
});
```

### Error Handling

```typescript
const onError = () => {
  // 1. Show toast notification
  toast.error('Please fill in all required fields correctly', {
    description: 'Check the highlighted fields below',
  });

  // 2. Auto-scroll to first error
  setTimeout(() => {
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (firstError as HTMLElement).focus();
    }
  }, 100);
};

// 3. Connect to form
<form onSubmit={form.handleSubmit(onSubmit, onError)}>
```

### Validation Schemas (Zod)

```typescript
export const step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.date({
    message: 'Date of birth is required',
  }),
  email: z.string().email('Invalid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
});
```

---

## 🧪 Testing Validation

### Test Scenario 1: Submit Empty Form
1. Open form (Step 1)
2. Click "Continue" without filling anything
3. **Expected:**
   - All fields show red borders
   - Error messages appear under each field
   - Toast notification shows
   - Page scrolls to first field (First Name)
   - First Name field is focused

### Test Scenario 2: Partial Completion
1. Fill First Name: "John"
2. Fill Last Name: "Smith"
3. Leave other fields empty
4. Click "Continue"
5. **Expected:**
   - First Name & Last Name: ✓ Valid (no error)
   - Date of Birth: ❌ Red border + error
   - Email: ❌ Red border + error
   - Mobile: ❌ Red border + error

### Test Scenario 3: Invalid Email
1. Fill all fields
2. Enter email: "invalid-email"
3. Click "Continue"
4. **Expected:**
   - Email field shows: ❌ "Invalid email address"
   - Other fields: ✓ Valid

### Test Scenario 4: Invalid Phone
1. Fill all fields
2. Enter phone: "123"
3. Leave email field and click Continue
4. **Expected:**
   - Mobile shows: ❌ "Invalid phone number"

### Test Scenario 5: Real-time Validation
1. Fill email: "invalid"
2. Click outside (blur)
3. **Expected:** Error appears immediately
4. Fix email: "valid@example.com"
5. **Expected:** Error disappears as you type

---

## 🎯 User Experience Flow

```
User fills form
     ↓
Clicks "Continue"
     ↓
Has errors? ──Yes──→ Show red borders
     │               ↓
     │          Show error messages
     │               ↓
     │          Toast notification
     │               ↓
     │          Scroll to first error
     │               ↓
     │          Focus first error field
     │               ↓
     │          User fixes errors
     │               ↓
     │          Errors clear as they type
     │
     No
     ↓
Form submits
     ↓
Go to next step
```

---

## 📱 Mobile Considerations

### Touch Targets
- Error messages don't block tap areas
- Scroll ensures error field is centered on screen
- Auto-focus works on mobile keyboards

### Visual Feedback
- Red borders are clearly visible
- Error text is readable (14px minimum)
- Toast appears at top of viewport

---

## ♿ Accessibility

### ARIA Attributes

```html
<!-- Invalid field -->
<input
  aria-invalid="true"
  aria-describedby="field-error field-description"
/>
<p id="field-error">First name is required</p>

<!-- Valid field -->
<input
  aria-invalid="false"
  aria-describedby="field-description"
/>
```

### Screen Reader Support
- Error messages are announced
- `aria-invalid` triggers screen reader alerts
- Focus management helps navigate to errors

### Keyboard Navigation
- Tab through fields normally
- Errors appear on blur (keyboard or mouse)
- Enter submits form and triggers validation

---

## 🔄 Validation Timeline

```
User Action          Validation Trigger       Visual Feedback
───────────────────────────────────────────────────────────────
Type in field        None                     Normal
Tab/Click away       onBlur validation        Show errors (if any)
Type again           onChange re-validation   Clear errors (if valid)
Click Continue       Full form validation     All errors shown
```

---

## 🎨 Component Breakdown

### Step 1 Example

```tsx
<FormField
  control={form.control}
  name="first_name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>First Name *</FormLabel>
      <FormControl>
        <Input placeholder="John" {...field} />
      </FormControl>
      <FormMessage />  {/* Shows error if invalid */}
    </FormItem>
  )}
/>
```

**What happens:**
1. User types → `field` value updates
2. User tabs away → `onBlur` validates
3. If invalid → `FormMessage` shows error
4. Input gets `aria-invalid="true"` → Red border appears
5. `FormLabel` gets `data-error="true"` → Red text
6. User types valid value → Error clears immediately

---

## 🚀 Future Enhancements

Potential additions:
- [ ] Real-time validation (on every keystroke)
- [ ] Field-level success indicators (✓ green checkmark)
- [ ] Validation progress indicator
- [ ] Custom error animations
- [ ] Field dependency validation
- [ ] Async validation (check email uniqueness)
- [ ] "Fix all errors" button

---

## 📚 Resources

- [react-hook-form Validation](https://react-hook-form.com/api/useform)
- [Zod Schema Validation](https://zod.dev/)
- [shadcn/ui Form Component](https://ui.shadcn.com/docs/components/form)
- [ARIA Invalid State](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid)

---

## ✨ Summary

The validation system provides:
- ✅ **Immediate feedback** when users leave fields
- ✅ **Clear visual indicators** with red borders
- ✅ **Helpful error messages** explaining what's wrong
- ✅ **Toast notifications** for overall form errors
- ✅ **Auto-scroll & focus** to errors
- ✅ **Accessible** for all users
- ✅ **Mobile-friendly** with proper touch targets

Users can't proceed to the next step until all required fields are valid! 🎉
