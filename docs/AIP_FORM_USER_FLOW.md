# AIP Form - User Flow Design

## Overview
A streamlined 5-step form that guides applicants through the mortgage application process with clear progress indication and conditional logic. Designed for maximum completion rates.

---

## Step 1: Let's Get Started (Lead Capture)
**Progress: 20%**
**🎯 GHL Integration: Create lead immediately after this step**

### Essential Contact Information
1. **"Let's start with the basics - what should we call you?"**
   - First Name (required)
   - Last Name (required)

2. **"When were you born?"**
   - Date of Birth (DD/MM/YYYY) - auto-calculate and display age

3. **"How can we reach you?"**
   - Email Address (required)
   - Mobile Number (required)

**Action:** Upon completion of Step 1:
- ✅ Create contact in GHL immediately (Name, Email, Mobile, DOB)
- ✅ Tag with "AIP-Application-Started"
- ✅ Trigger welcome email/SMS sequence
- ✅ Save application to allow continuation

---

## Step 2: About You
**Progress: 40%**

### Personal Details
1. **"A bit more about you"**
   - Nationality (dropdown/autocomplete)
   - Marital Status (Single / Married / Civil Partnership / Divorced / Widowed)
   - Telephone Number (optional - if different from mobile)

### Co-Applicants
2. **"Are you applying with anyone else?"**
   - No / Yes
   
   **If Yes:**
   - Show: "Great! Let's get their details"
   - First Name, Last Name, Email, Mobile, Date of Birth, Nationality, Marital Status
   - "Add another applicant?" button (allow up to 4 total)

**Action:** Upon completion of Step 2:
- ✅ Update GHL contact with nationality and marital status
- ✅ Create co-applicant contacts if applicable
- ✅ Link co-applicants to primary contact

---

## Step 3: Your Home & Financial Position
**Progress: 60%**

### Current Residence (Per Applicant)
1. **"Where do you currently live?"**
   - Current Address
   - Time at address (Years/Months)
   - Homeowner or Tenant?
   
   **If Homeowner:**
   - Monthly Mortgage Payment
   - Current Property Value
   - Mortgage Outstanding
   - Lender Name
   
   **If Tenant:**
   - Monthly Rent
   - Landlord Details

2. **"Have you lived here less than 3 years?"**
   - If Yes: Previous Address + Duration

### Tax & Family
3. **"Which country are you registered for tax?"**
   - Country dropdown

4. **"Do you have children?"**
   - No / Yes (if yes, add ages dynamically)

---

## Step 4: Employment & Income
**Progress: 70%**

### For Each Applicant:
1. **"What's your employment status?"**
   - Employed / Self-Employed / Company Director / Retired / Unemployed / Other

### If Employed:
2. **"Tell us about your job"**
   - Job Title
   - Employer Name & Address
   - Time with employer (Years/Months)
   - Gross Annual Salary
   - Net Monthly Income
   - Previous employment (if less than 3 years)

### If Self-Employed/Director:
2. **"Tell us about your business"**
   - Business Name & Address
   - Website (optional)
   - Company Creation Date
   - Your Ownership %
   - Gross Annual Income
   - Net Annual Income (+ bonuses/commissions details)
   - Accountant can provide info? (Yes/No + contact details)

### Financial Commitments (All Applicants)
3. **"Your monthly commitments"**
   - Personal Loans
   - Credit Card Debt
   - Car Loans/Leases
   - Total (auto-calculated)

4. **"Important disclosure"**
   - Any credit problems, criminal convictions, or investigations? (Yes/No + details)

---

## Step 5: Property Portfolio & Assets
**Progress: 85%**

### Investment Properties
1. **"Do you own any rental or buy-to-let properties?"**
   - No / Yes
   
   **If Yes:**
   - For each property: Address, Valuation, Mortgage Outstanding, Monthly Payment, Monthly Rent
   - "Add another property" button

### Other Assets
2. **"Do you have other significant assets?"**
   - Text area (savings, investments, etc.)

---

## Step 6: Spanish Property & Submission
**Progress: 95%**

### Spanish Property Details
1. **"Tell us about the Spanish property you're interested in"**
   - Purchase Price or Re-mortgage Value
   - Deposit Available
   - Property Address (if known)
   - Property Type (Villa / Apartment / Townhouse / Land / Commercial / Other)
   - Will this be your... (Primary Residence / Second Home / Investment)
   - How urgent is this? (Low / Medium / High / Very High)

2. **"Your support team (optional)"**
   - Real Estate Agent Contact
   - Lawyer Contact

### Additional Information
3. **"Anything else we should know?"**
   - Text area for additional context

### Review & Submit
**Progress: 100%**

4. **"Let's review your application"**
   - Expandable summary sections (edit any section)
   - Privacy Policy checkbox (required)
   - Terms & Conditions checkbox (required)
   - **Submit Application** button

**Action:** Upon submission:
- ✅ Tag in GHL: "AIP-Application-Completed"
- ✅ Move to "Application Review" pipeline
- ✅ Notify review team
- ✅ Send confirmation email

---

## UX Features to Implement

### Progress Indication
- Progress bar at top showing % completion (20%, 40%, 60%, 70%, 85%, 100%)
- Step indicators (Step 1 of 6, Step 2 of 6, etc.)
- Visual checkmarks for completed sections
- Ability to save and continue later

### Validation
- Real-time field validation
- Required field indicators
- Format validation (email, phone, dates)

### Navigation
- "Continue" button (disabled until required fields complete)
- "Back" button to edit previous steps
- "Save for Later" button (sends magic link to email)

### Smart Features
- Auto-save every 30 seconds
- Conditional logic (show/hide based on answers)
- Auto-complete for addresses
- Currency formatting
- Date picker with age calculation
- Mobile-optimized interface

### GHL Integration Points
1. **Step 1 Completion** (CRITICAL - Immediate Lead Capture):
   - Capture: First Name, Last Name, Email, Mobile, DOB (age calculated)
   - Tag: "AIP-Application-Started"
   - Trigger: Welcome automation (email/SMS)
   - **This happens as soon as they complete Step 1 - your lead is captured!**

2. **Step 2 Completion**: Add personal details
   - Custom Fields: Nationality, Marital Status
   - Create and link co-applicant contacts

3. **Step 3 Completion**: Enrich contact data
   - Custom Fields: Home Address, Homeowner/Tenant, Tax Country
   - Tag based on homeowner status

4. **Step 4 (Employment)**: Update employment info
   - Custom Field: Employment Status, Annual Income
   - Trigger: Relevant nurture sequence based on employment type
   - Tag: "AIP-Employed" / "AIP-Self-Employed" / etc.

5. **Step 5 (Portfolio)**: Flag high-value leads
   - Custom Field: Number of Properties, Total Portfolio Value
   - Tag: "AIP-Portfolio-Owner" if rental properties exist

6. **Step 6 (Submission)**: Complete application
   - Custom Fields: Property Type, Purchase Price, Urgency, Property Address
   - Tag: "AIP-Application-Completed"
   - Move to "Application Review" pipeline stage
   - Trigger: Internal notification to review team
   - Send: Confirmation email to applicant

6. **Save for Later**: Update GHL activity
   - Tag: "AIP-Application-Incomplete-StepX"
   - Add note: "Incomplete at Step X"
   - Trigger: Follow-up automation (reminder after 24h, 72h, 7d)

7. **Abandonment Tracking**
   - If user doesn't complete Step 1 within 3 minutes: Tag "AIP-Abandoned-Step1"
   - If user completes Step 1 but doesn't continue within 30 mins: Tag "AIP-Step1-Only"
   - If user completes Step 2 but abandons: Tag "AIP-Abandoned-Step2"
   - Trigger: Re-engagement sequences based on drop-off point
   - **Note**: Step 1 is so quick (1 min) that most abandonment should be minimal

---

## Estimated Time to Complete

- **Step 1**: 1 minute (critical for lead capture - name, DOB, email, mobile only)
- **Step 2**: 2 minutes (nationality, marital status, co-applicants)
- **Step 3**: 3-4 minutes (residence details)
- **Step 4**: 4-5 minutes (employment - varies by type)
- **Step 5**: 2-3 minutes (portfolio - less if none)
- **Step 6**: 3-4 minutes (Spanish property + review)

**Total Estimated Time: 15-20 minutes**

---

## Why Step 1 is Optimized for Lead Capture

### Psychology
- **Under 1 minute to complete** = minimal friction
- Only 4 pieces of info (First name, Last name, DOB, Email, Mobile)
- No overwhelming questions
- Immediate value exchange ("We'll help you with Spanish property financing")

### Business Benefits
- **Capture lead in under 60 seconds**
- Even if they abandon, you have contact info to follow up
- DOB allows for age-based segmentation in GHL
- Can send personalized follow-up based on age, timing, etc.

### Conversion Strategy
- Keep Step 1 super simple = higher completion
- Once in GHL, automated nurture can bring them back
- Follow-up can be: "You started your application! Just 4 more quick steps to complete."

---

## Estimated Time to Complete

- **Step 1**: 1 minute (critical for lead capture - name, DOB, email, mobile only)
- **Step 2**: 2 minutes (nationality, marital status, co-applicants)
- **Step 3**: 3-4 minutes (residence details)
- **Step 4**: 4-5 minutes (employment - varies by type)
- **Step 5**: 2-3 minutes (portfolio - less if none)
- **Step 6**: 3-4 minutes (Spanish property + review)

**Total Estimated Time: 15-20 minutes**

---

## Mobile vs Desktop Considerations

### Mobile (One Question at a Time)
- Each section within a step becomes a sub-step
- Show mini-progress within each step
- Example: Step 1 → "1/3: What's your name?" → "2/3: When were you born?" → "3/3: How can we reach you?"
- Swipe gestures for navigation

### Desktop (Grouped Sections)
- Show all questions in a step on one screen
- Sticky progress bar
- Scroll spy to highlight current section
- Larger form fields side-by-side where logical

---

## Smart Features Detail

### Auto-Save
- Save to database every 30 seconds
- Visual indicator: "Saving..." / "All changes saved ✓"
- Works offline (local storage) then syncs

### Conditional Logic Examples
- Only show "Previous Address" if lived at current address < 3 years
- Only show employment details relevant to selected employment status
- Hide property portfolio section if user selects "No"
- Show accountant fields only if self-employed

### Field Intelligence
- Auto-format phone numbers
- Auto-format currency inputs
- Address autocomplete (Google Places API)
- Email validation with typo suggestions (e.g., "Did you mean @gmail.com?")
- Age auto-calculation from DOB

### Help & Guidance
- Tooltip icons (ℹ️) next to complex fields
- Example text in placeholders
- Inline validation messages
- Help chat widget (optional)

---

## Accessibility Enhancements

- Keyboard navigation (Tab, Shift+Tab, Enter to continue)
- Screen reader announcements for step changes
- ARIA labels on all form fields
- High contrast mode support
- Focus indicators
- Error messages announced to screen readers
- Skip to section links

---

## Testing & Optimization

### A/B Testing Opportunities
1. Step 1 wording: "What should we call you?" vs "Your name"
2. Progress visualization: Bar vs Steps vs Percentage only
3. Co-applicant prompt: "Applying with someone?" vs "Joint application?"
4. Button text: "Continue" vs "Next" vs "Save & Continue"

### Key Metrics to Track
- Drop-off rate per step
- Average time per step
- Overall completion rate
- Save-for-later usage
- Mobile vs desktop completion rates
- GHL lead creation success rate

### Conversion Optimization
- Add trust signals (SSL badge, privacy guarantee)
- Show "Your data is secure" message
- Display "Most applicants complete this in 15 minutes"
- Add exit-intent popup: "Save your progress before you go?"

### Accessibility
- Keyboard navigation
- Screen reader friendly
- High contrast mode
- Clear error messages
- Help tooltips for complex fields

---

## Mobile Considerations
- One question per screen on mobile
- Large touch targets
- Swipe gestures for navigation
- Minimal typing (use dropdowns/selections where possible)
- Biometric autofill for contact info
