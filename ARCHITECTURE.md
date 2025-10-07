# 🏗️ Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIP FACT FIND APPLICATION                     │
│                   Multi-Step Form Architecture                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │                    app/page.tsx                          │
    │                (Main Entry Point)                        │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │          components/form/multi-step-form.tsx            │
    │                  (Form Container)                        │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  • Manages current step                          │  │
    │  │  • Handles navigation                            │  │
    │  │  • Auto-save logic                               │  │
    │  │  • Renders step components                       │  │
    │  └──────────────────────────────────────────────────┘  │
    └──────────────┬──────────────────────┬──────────────────┘
                   │                      │
         ┌─────────▼──────────┐  ┌───────▼──────────┐
         │  FormProgress      │  │  FormNavigation  │
         │  ┌──────────────┐  │  │  ┌────────────┐  │
         │  │ Progress Bar │  │  │  │ Back Btn   │  │
         │  │ Step Badges  │  │  │  │ Next Btn   │  │
         │  │ % Complete   │  │  │  │ Save Btn   │  │
         │  └──────────────┘  │  │  └────────────┘  │
         └────────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FORM STEPS LAYER                            │
└─────────────────────────────────────────────────────────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Step 1    │  │  Step 2    │  │  Step 3    │  │  Step 4    │
│  Lead      │→ │  About     │→ │  Your      │→ │  Employ-   │
│  Capture   │  │  You       │  │  Home      │  │  ment      │
│            │  │            │  │            │  │            │
│ • Name     │  │ • National │  │ • Address  │  │ • Status   │
│ • DOB      │  │ • Marital  │  │ • Owner/   │  │ • Job      │
│ • Email    │  │ • Phone    │  │   Tenant   │  │ • Income   │
│ • Mobile   │  │ • Co-Apps  │  │ • Tax      │  │ • Commits  │
│            │  │            │  │ • Children │  │            │
│ [20%]      │  │ [40%]      │  │ [60%]      │  │ [70%]      │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
                                                        │
    ┌───────────────────────────────────────────────────┘
    │
    ▼
┌────────────┐  ┌────────────────────────────────────────┐
│  Step 5    │  │  Step 6                                │
│  Portfolio │→ │  Spanish Property & Submit             │
│            │  │                                        │
│ • Rentals  │  │ • Purchase Price                       │
│ • Assets   │  │ • Deposit                              │
│            │  │ • Property Type                        │
│ [85%]      │  │ • Urgency                              │
└────────────┘  │ • Review & Submit                      │
                │                                        │
                │ [100%]                                 │
                └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                            │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │              lib/store/form-store.ts                     │
    │                (Zustand Store)                           │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  State:                                          │  │
    │  │  • step1, step2, step3, step4, step5, step6     │  │
    │  │  • currentStep                                   │  │
    │  │  • applicationId                                 │  │
    │  │                                                  │  │
    │  │  Actions:                                        │  │
    │  │  • updateStepX()                                │  │
    │  │  • nextStep()                                   │  │
    │  │  • previousStep()                               │  │
    │  │  • setCurrentStep()                             │  │
    │  │  • getProgress()                                │  │
    │  │  • resetForm()                                  │  │
    │  └──────────────────────────────────────────────────┘  │
    │                           │                             │
    │                    Persisted to                         │
    │                           ▼                             │
    │                  localStorage                           │
    │             (aip-form-storage)                          │
    └─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION LAYER                            │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │          lib/validations/form-schemas.ts                 │
    │                    (Zod Schemas)                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  • step1Schema                                   │  │
    │  │  • step2Schema                                   │  │
    │  │  • step3Schema                                   │  │
    │  │  • step4EmployedSchema                          │  │
    │  │  • step4SelfEmployedSchema                      │  │
    │  │  • step5Schema                                   │  │
    │  │  • step6Schema                                   │  │
    │  │                                                  │  │
    │  │  ✓ Type-safe validation                         │  │
    │  │  ✓ Custom error messages                        │  │
    │  │  ✓ Conditional validation                       │  │
    │  └──────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────┘
                             │
                             ▼
                    react-hook-form
                     (Form Control)

┌─────────────────────────────────────────────────────────────────┐
│                      TYPE SAFETY LAYER                           │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │              lib/types/application.ts                    │
    │                 (TypeScript Types)                       │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  Interfaces:                                     │  │
    │  │  • Applicant                                     │  │
    │  │  • Child                                         │  │
    │  │  • EmploymentDetails                            │  │
    │  │  • FinancialCommitments                         │  │
    │  │  • RentalProperty                               │  │
    │  │  • AdditionalAsset                              │  │
    │  │  • Application                                   │  │
    │  │  • FormState                                     │  │
    │  │                                                  │  │
    │  │  Enums:                                          │  │
    │  │  • ApplicationStatus                            │  │
    │  │  • EmploymentStatus                             │  │
    │  │  • MaritalStatus                                │  │
    │  │  • PropertyType                                  │  │
    │  │  • UrgencyLevel                                 │  │
    │  └──────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │           lib/supabase/client.ts                         │
    │              (Supabase Client)                           │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │                  SUPABASE DATABASE                       │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  Tables:                                         │  │
    │  │  ┌─────────────────────────────────────────┐    │  │
    │  │  │  applications                           │    │  │
    │  │  │  ├── applicants (1:many)               │    │  │
    │  │  │  │   ├── applicant_children           │    │  │
    │  │  │  │   ├── employment_details           │    │  │
    │  │  │  │   └── financial_commitments        │    │  │
    │  │  │  ├── rental_properties (1:many)        │    │  │
    │  │  │  ├── additional_assets (1:many)        │    │  │
    │  │  │  └── form_progress                     │    │  │
    │  │  └─────────────────────────────────────────┘    │  │
    │  │                                                  │  │
    │  │  Row Level Security (RLS):                      │  │
    │  │  ✓ Users can only access their own data        │  │
    │  │                                                  │  │
    │  │  Functions & Triggers:                          │  │
    │  │  ✓ Auto-update timestamps                       │  │
    │  │  ✓ Calculate age from DOB                       │  │
    │  │  ✓ Calculate total commitments                  │  │
    │  └──────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐        ┌──────────────────────┐
    │  GoHighLevel (GHL)  │        │  Email Service       │
    │  ┌───────────────┐  │        │  (Resend/SendGrid)   │
    │  │ Webhooks      │  │        │  ┌────────────────┐  │
    │  │ • Step 1      │  │        │  │ Welcome Email  │  │
    │  │ • Updates     │  │        │  │ Reminders      │  │
    │  │ • Tags        │  │        │  │ Confirmation   │  │
    │  │ • Pipeline    │  │        │  │ Magic Link     │  │
    │  └───────────────┘  │        │  └────────────────┘  │
    └─────────────────────┘        └──────────────────────┘
             ▲                                ▲
             │                                │
    ┌────────┴────────────────────────────────┴─────────┐
    │                                                    │
    │          APPLICATION EVENT TRIGGERS                │
    │                                                    │
    │  • Step 1 Complete → Create GHL Contact           │
    │  • Each Step → Update Custom Fields               │
    │  • Form Submit → Pipeline Stage Change            │
    │  • Save for Later → Send Magic Link Email         │
    │  • Abandon → Tag & Trigger Re-engagement          │
    │                                                    │
    └────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       DATA FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

User Input → Form Component → react-hook-form → Zod Validation
                                       │
                                       ▼
                              Zustand Store (State Update)
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              localStorage        Supabase          GHL Webhook
              (Auto-save)         (Persist)         (Lead Creation)

┌─────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS                               │
└─────────────────────────────────────────────────────────────────┘

    shadcn/ui Components Used:
    ┌─────────────────────────────────────────────────────────┐
    │  • Form              • Button          • Calendar       │
    │  • Input             • Select          • Popover        │
    │  • Textarea          • Card            • Radio Group    │
    │  • Label             • Progress        • Separator      │
    │  • Badge             • Sonner (Toast)                   │
    └─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MONITORING & ANALYTICS                      │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
    │  Google         │  │  Sentry         │  │  Vercel      │
    │  Analytics      │  │  (Errors)       │  │  Analytics   │
    │                 │  │                 │  │              │
    │  • Page views   │  │  • Exceptions   │  │  • Core Web  │
    │  • Events       │  │  • Failed API   │  │    Vitals    │
    │  • Conversions  │  │  • User context │  │  • Speed     │
    └─────────────────┘  └─────────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

    1. Input Validation (Zod)
    2. Type Safety (TypeScript)
    3. RLS Policies (Supabase)
    4. Environment Variables (Secrets)
    5. HTTPS Only (Production)
    6. CORS Configuration
    7. Rate Limiting
    8. XSS Protection

┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT                                  │
└─────────────────────────────────────────────────────────────────┘

    Development → Staging → Production
         │            │           │
         ▼            ▼           ▼
    localhost:3000  staging.   app.
                    domain     domain

    CI/CD Pipeline:
    GitHub → Vercel Auto-Deploy → Live

┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS METRICS                               │
└─────────────────────────────────────────────────────────────────┘

    📊 KPIs to Track:
    • Step 1 Completion: >90%
    • Overall Completion: >60%
    • Avg. Time per Step
    • Drop-off Points
    • GHL Lead Creation Rate
    • Form Submission Success Rate
```

---

## Key Design Principles

### 1. **Separation of Concerns**
- Components handle UI only
- Store handles state
- Validation is separate
- Types are centralized

### 2. **Type Safety**
- End-to-end TypeScript
- Zod runtime validation
- Database types match application types

### 3. **Progressive Enhancement**
- Works without JavaScript (forms)
- Mobile-first responsive
- Accessibility built-in

### 4. **Performance**
- Lazy load components
- Debounced auto-save
- Optimistic updates
- Local state first

### 5. **Scalability**
- Modular architecture
- Easy to add new steps
- Reusable components
- Clean separation

---

This architecture ensures:
✅ Maintainability
✅ Scalability
✅ Type Safety
✅ Performance
✅ User Experience
✅ Security
