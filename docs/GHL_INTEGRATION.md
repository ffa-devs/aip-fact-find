# GoHighLevel (GHL) Integration Guide

## 🎯 Overview

The AIP Fact Find form integrates with **GoHighLevel CRM** to automatically capture and manage leads throughout the application process. All sensitive credentials are stored in environment variables for security.

---

## 🔐 Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# GoHighLevel Configuration
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=your_ghl_location_id_here
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_ID
```

### How to Get These Values

1. **GHL_API_KEY**
   - Log into your GoHighLevel account
   - Go to Settings → API Keys
   - Create a new API key with "Contacts" permissions
   - Copy the key

2. **GHL_LOCATION_ID**
   - In GHL, go to Settings → Business Profile
   - Copy your Location ID (or Sub-account ID)

3. **GHL_WEBHOOK_URL** (Optional)
   - Go to Automations → Workflows
   - Create a webhook trigger
   - Copy the webhook URL

---

## 📊 Data Flow

### Step 1: Lead Capture (Required)
When user completes Step 1:
```
User submits Step 1
       ↓
POST /api/gohigh/create-lead
       ↓
Create GHL Contact
       ↓
Return Contact ID
       ↓
Store in Zustand (ghlContactId)
       ↓
Proceed to Step 2
```

**Data Sent:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+34612345678",
  "dateOfBirth": "1990-05-15",
  "tags": ["AIP-Application-Started", "Lead-Source-Website"],
  "source": "AIP Fact Find Form"
}
```

**Tags Added:**
- `AIP-Application-Started`
- `Lead-Source-Website`

---

### Step 2: About You
When user completes Step 2:
```
User submits Step 2
       ↓
PUT /api/gohigh/update-contact
       ↓
Update GHL Contact
       ↓
Add/Remove Tags
       ↓
Update Custom Fields
       ↓
Proceed to Step 3
```

**Custom Fields:**
- `nationality`
- `marital_status`
- `has_co_applicants`

**Tags Added:**
- `AIP-Step2-Completed`
- `Has-Co-Applicant` (if applicable)

**Tags Removed:**
- `AIP-Step1-Only`

---

### Step 3: Your Home
**Custom Fields:**
- `homeowner_or_tenant`
- `tax_country`
- `has_children`

**Tags Added:**
- `AIP-Step3-Completed`
- `Current-Homeowner` OR `Current-Tenant`
- `Has-Children` (if applicable)

---

### Step 4: Employment
**Custom Fields:**
- `employment_status`
- `annual_income`
- `has_credit_issues`

**Tags Added:**
- `AIP-Step4-Completed`
- `AIP-Employed` OR `AIP-Self-Employed`
- `High-Income` (≥$100k) OR `Medium-Income` (≥$50k)
- `Credit-Issues-Declared` (if applicable)

---

### Step 5: Portfolio
**Custom Fields:**
- `has_rental_properties`
- `rental_property_count`

**Tags Added:**
- `AIP-Step5-Completed`
- `AIP-Portfolio-Owner` (if has properties)
- `Large-Portfolio` (if ≥3 properties)

---

### Step 6: Spanish Property (Final)
**Custom Fields:**
- `purchase_price`
- `deposit_available`
- `loan_amount_needed` (calculated)
- `ltv_percentage` (calculated)
- `property_type`
- `home_status`
- `urgency_level`
- `application_status: "Completed"`

**Tags Added:**
- `AIP-Application-Completed`
- `High-Priority-Lead` (if urgency high/very_high)
- `Property-Type-{type}` (e.g., `Property-Type-villa`)
- `Primary-Residence` OR `Second-Home` OR `Investment-Property`

**Tags Removed:**
- All abandoned tags (`AIP-Abandoned-Step2`, etc.)

---

## 🏷️ Complete Tag System

### Progress Tags
- ✅ `AIP-Application-Started` - Step 1 completed
- ✅ `AIP-Step2-Completed` - Step 2 completed
- ✅ `AIP-Step3-Completed` - Step 3 completed
- ✅ `AIP-Step4-Completed` - Step 4 completed
- ✅ `AIP-Step5-Completed` - Step 5 completed
- ✅ `AIP-Application-Completed` - All steps completed

### Source Tags
- 🌐 `Lead-Source-Website` - Form submission source

### Demographic Tags
- 👤 `Has-Co-Applicant` - Multiple applicants
- 👶 `Has-Children` - Has dependent children

### Property Tags
- 🏠 `Current-Homeowner` - Currently owns property
- 🏠 `Current-Tenant` - Currently renting
- 🏢 `AIP-Portfolio-Owner` - Has rental properties
- 🏢 `Large-Portfolio` - 3+ rental properties

### Employment Tags
- 💼 `AIP-Employed` - Traditional employment
- 💼 `AIP-Self-Employed` - Self-employed or director
- 💰 `High-Income` - Annual income ≥ $100,000
- 💰 `Medium-Income` - Annual income ≥ $50,000

### Financial Tags
- ⚠️ `Credit-Issues-Declared` - Has credit/legal issues

### Spanish Property Tags
- 🇪🇸 `Property-Type-villa`
- 🇪🇸 `Property-Type-apartment`
- 🇪🇸 `Property-Type-townhouse`
- 🇪🇸 `Property-Type-land`
- 🇪🇸 `Property-Type-commercial`
- 🇪🇸 `Primary-Residence` - Will live there full-time
- 🇪🇸 `Second-Home` - Holiday home
- 🇪🇸 `Investment-Property` - Rental investment

### Priority Tags
- 🔥 `High-Priority-Lead` - High/very high urgency

### Abandoned Tags (for follow-up)
- ⚠️ `AIP-Step1-Only` - Stopped after Step 1
- ⚠️ `AIP-Abandoned-Step2` - Abandoned at Step 2
- ⚠️ `AIP-Abandoned-Step3` - Abandoned at Step 3
- ⚠️ `AIP-Abandoned-Step4` - Abandoned at Step 4
- ⚠️ `AIP-Abandoned-Step5` - Abandoned at Step 5
- ⚠️ `AIP-Abandoned-Step6` - Abandoned at Step 6

---

## 🔌 API Endpoints

### POST `/api/gohigh/create-lead`
Creates initial GHL contact from Step 1 data.

**Request:**
```typescript
{
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth: Date;
}
```

**Response:**
```typescript
{
  success: true,
  contactId: string,
  message: "Lead created successfully in GHL"
}
```

---

### PUT `/api/gohigh/update-contact`
Updates GHL contact as user progresses through steps.

**Request:**
```typescript
{
  contactId: string;
  step: number; // 2-6
  data: {
    // Step-specific data
  }
}
```

**Response:**
```typescript
{
  success: true,
  message: "Contact updated for Step {step}"
}
```

---

## 💻 Code Implementation

### Client-Side (Step 1)

```typescript
// In step1-lead-capture.tsx
const onSubmit = async (data: Step1FormData) => {
  updateStep1(data);
  
  if (!ghlContactId) {
    const response = await fetch('/api/gohigh/create-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      setGhlContactId(result.contactId);
      toast.success('Lead created successfully!');
    }
  }
  
  onNext();
};
```

### Client-Side (Steps 2-6)

```typescript
// In step2-about-you.tsx (example)
const onSubmit = async (data: Step2FormData) => {
  updateStep2(data);
  
  if (ghlContactId) {
    await fetch('/api/gohigh/update-contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: ghlContactId,
        step: 2,
        data: {
          nationality: data.nationality,
          marital_status: data.marital_status,
          has_co_applicants: data.has_co_applicants,
        },
      }),
    });
  }
  
  onNext();
};
```

### Server-Side (API Route)

```typescript
// app/api/gohigh/create-lead/route.ts
import { createLeadInGHL } from '@/lib/ghl/service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { applicationId, ...step1Data } = body;
  const result = await createLeadInGHL(step1Data, applicationId);
  
  return NextResponse.json({
    success: true,
    contactId: result.contactId,
    opportunityId: result.opportunityId,
  });
}
```

---

## 🔧 GHL Service Layer

Located in `/lib/ghl/service.ts`:

### Available Functions

```typescript
// Create initial lead (checks for existing opportunity)
createLeadInGHL(data: Step1FormData, applicationId: string): Promise<{
  contactId: string
  opportunityId: string | null
  isExisting: boolean
  existingData?: object
}>

// Update for each step
updateStep2InGHL(contactId: string, data): Promise<void>
updateStep3InGHL(contactId: string, data): Promise<void>
updateStep4InGHL(contactId: string, data): Promise<void>
updateStep5InGHL(contactId: string, data): Promise<void>
completeApplicationInGHL(contactId: string, data): Promise<void>

// Mark as abandoned
markAsAbandoned(contactId: string, step: number): Promise<void>

// Webhook alternative
sendCompleteFormViaWebhook(formData): Promise<boolean>
```

---

## 🧪 Testing

### 1. Test API Connection

```bash
# Check if GHL credentials work
curl -X POST https://services.leadconnectorhq.com/v1/contacts/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "YOUR_LOCATION_ID",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+34612345678"
  }'
```

### 2. Test Form Integration

1. Fill out Step 1 with test data
2. Check browser console for:
   ```
   ✅ Contact created in GHL: contact_abc123
   ```
3. Verify in GHL dashboard:
   - Contact exists
   - Has correct tags
   - Custom fields populated

### 3. Test Tag Progression

1. Complete Step 1 → Check for `AIP-Application-Started`
2. Complete Step 2 → Check for `AIP-Step2-Completed`, removed `AIP-Step1-Only`
3. Continue through all steps
4. Final step → Check for `AIP-Application-Completed`

---

## 🚨 Error Handling

### GHL API Fails
- ✅ Form data still saved in Zustand (localStorage)
- ✅ User can continue with form
- ✅ Toast notification shown: "Could not sync with CRM"
- ✅ Error logged to console

### Network Issues
- ✅ Retry logic can be added to GHL client
- ✅ Queue failed requests for later sync
- ✅ User experience not interrupted

### Missing Credentials
- ⚠️ Console warning shown
- ⚠️ GHL sync silently fails
- ✅ Form still works normally

---

## 📈 Automation Ideas

### In GHL Workflows

1. **Step 1 Complete** (`AIP-Application-Started`)
   - Send welcome email
   - Assign to sales rep
   - Start nurture sequence

2. **High Priority Lead** (`High-Priority-Lead`)
   - Send SMS notification to sales team
   - Move to priority pipeline
   - Schedule urgent follow-up

3. **Abandoned Forms**
   - `AIP-Abandoned-Step2` → Send completion reminder (1 hour)
   - `AIP-Abandoned-Step3` → Send completion reminder (24 hours)
   - `AIP-Abandoned-Step4+` → Personal follow-up call

4. **Application Complete** (`AIP-Application-Completed`)
   - Send confirmation email
   - Create opportunity in CRM
   - Assign to mortgage specialist
   - Calculate LTV and suggest products

---

## 🔒 Security

- ✅ **API keys never exposed to client** - Server-side only
- ✅ **Environment variables** - Not in source code
- ✅ **HTTPS only** - Encrypted in transit
- ✅ **No admin interface needed** - Fully automated
- ✅ **Validation** - All data validated before sending

---

## 📊 Custom Fields Reference

| Field Name | Type | Source Step |
|------------|------|-------------|
| `nationality` | string | Step 2 |
| `marital_status` | string | Step 2 |
| `has_co_applicants` | boolean | Step 2 |
| `homeowner_or_tenant` | string | Step 3 |
| `tax_country` | string | Step 3 |
| `has_children` | boolean | Step 3 |
| `employment_status` | string | Step 4 |
| `annual_income` | number | Step 4 |
| `has_credit_issues` | boolean | Step 4 |
| `has_rental_properties` | boolean | Step 5 |
| `rental_property_count` | number | Step 5 |
| `purchase_price` | number | Step 6 |
| `deposit_available` | number | Step 6 |
| `loan_amount_needed` | number | Step 6 (calculated) |
| `ltv_percentage` | number | Step 6 (calculated) |
| `property_type` | string | Step 6 |
| `home_status` | string | Step 6 |
| `urgency_level` | string | Step 6 |
| `application_status` | string | Step 6 |

---

## 🚀 Deployment Checklist

- [ ] Set `GHL_API_KEY` in production environment
- [ ] Set `GHL_LOCATION_ID` in production environment
- [ ] (Optional) Set `GHL_WEBHOOK_URL` for webhooks
- [ ] Test contact creation in GHL
- [ ] Verify custom fields exist in GHL
- [ ] Set up GHL workflows for automation
- [ ] Configure tag-based automations
- [ ] Test error scenarios

---

## 📚 Resources

- [GHL API Documentation](https://highlevel.stoplight.io/)
- [GHL Contact Management](https://docs.gohighlevel.com/contacts)
- [GHL Webhooks](https://docs.gohighlevel.com/webhooks)
- [GHL Custom Fields](https://docs.gohighlevel.com/custom-fields)

---

## ✨ Summary

✅ **Automatic Lead Capture** - Step 1 creates contact  
✅ **Progressive Enrichment** - Each step adds more data  
✅ **Smart Tagging** - Automatic categorization  
✅ **No Admin Needed** - Fully automated via env vars  
✅ **Error Resilient** - Form works even if GHL fails  
✅ **Workflow Ready** - Tags trigger automations in GHL

Your leads are automatically synced to GHL throughout the form journey! 🎉
