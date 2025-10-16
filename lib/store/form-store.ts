import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormState } from '@/lib/types/application';
import { 
  createApplication,
  saveStep1Data,
  saveStep2Data,
  loadApplicationData,
} from '@/lib/services/api-service';
import { transformDatabaseToFormState } from '@/lib/services/supabase-service';

const initialState: FormState = {
  step1: {
    first_name: '',
    last_name: '',
    date_of_birth: null,
    email: '',
    mobile: '',
  },
  step2: {
    nationality: '',
    marital_status: '',
    telephone: '',
    has_co_applicants: false,
    co_applicants: [],
  },
  step3: {
    same_address_as_primary: false,
    current_address: '',
    move_in_date: null,
    homeowner_or_tenant: '',
    monthly_mortgage_or_rent: 0,
    monthly_payment_currency: 'EUR',
    current_property_value: 0,
    property_value_currency: 'EUR',
    mortgage_outstanding: 0,
    mortgage_outstanding_currency: 'EUR',
    lender_or_landlord_details: '',
    previous_address: '',
    previous_move_in_date: null,
    previous_move_out_date: null,
    tax_country: '',
    has_children: false,
    children: [],
    co_applicants: [],
  },
  step4: {
    employment_status: '',
    employment_details: {},
    financial_commitments: {},
    co_applicants: [],
  },
  step5: {
    has_rental_properties: false,
    rental_properties: [],
    other_assets: '',
  },
  step6: {
    urgency_level: '',
    purchase_price: 0,
    deposit_available: 0,
    property_address: '',
    home_status: '',
    property_type: '',
    real_estate_agent_contact: '',
    lawyer_contact: '',
    additional_information: '',
    authorization_consent: false,
  },
  currentStep: 1,
  applicationId: null,
  ghlContactId: null, // Track GHL contact ID
  ghlOpportunityId: null, // Track GHL opportunity ID
  lastError: null
};

interface FormActions {
  // Update functions with auto-save
  updateStep1: (data: Partial<FormState['step1']>) => Promise<void>;
  updateStep2: (data: Partial<FormState['step2']>) => Promise<void>;
  updateStep3: (data: Partial<FormState['step3']>) => Promise<void>;
  updateStep4: (data: Partial<FormState['step4']>) => Promise<void>;
  updateStep5: (data: Partial<FormState['step5']>) => Promise<void>;
  updateStep6: (data: Partial<FormState['step6']>) => Promise<void>;
  
  // Multi-applicant specific functions for Steps 3 & 4
  updateStep3ForApplicant: (applicantIndex: number, data: Record<string, unknown>) => Promise<void>;
  updateStep4ForApplicant: (applicantIndex: number, data: Record<string, unknown>) => Promise<void>;
  
  // Navigation and state management
  setCurrentStep: (step: number) => void;
  setApplicationId: (id: string) => void;
  setGhlContactId: (id: string) => void;
  setGhlOpportunityId: (id: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetForm: () => void;
  getProgress: () => number;
  
  // Database operations
  createNewApplication: (ghlContactId?: string) => Promise<string | null>;
  loadApplication: (applicationId: string) => Promise<boolean>;
  saveCurrentProgress: () => Promise<void>;
  
  // Validation functions
  isStepValid: (stepNumber: number) => boolean;
  canNavigateToStep: (stepNumber: number) => boolean;
  
  // Error handling
  lastError?: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useFormStore = create<FormState & FormActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateStep1: async (data) => {
        // Update local state first
        set((state) => ({
          step1: { ...state.step1, ...data },
          lastError: null,
        }));

        // Sync to database
        const state = get();
        if (state.applicationId) {
          const result = await saveStep1Data(state.applicationId, { ...state.step1, ...data });
          if (result.error) {
            set({ lastError: result.error });
          }
        }
      },

      updateStep2: async (data) => {
        // Update local state first
        set((state) => ({
          step2: { ...state.step2, ...data },
          lastError: null,
        }));

        // Sync to database
        const state = get();
        if (state.applicationId) {
          const result = await saveStep2Data(state.applicationId, { ...state.step2, ...data });
          if (result.error) {
            set({ lastError: result.error });
          }
        }
      },

      updateStep3: async (data) => {
        // Update local state first
        set((state) => ({
          step3: { ...state.step3, ...data },
          lastError: null,
        }));

        // TODO: Implement Step 3 API route
      },

      updateStep4: async (data) => {
        // Update local state first
        set((state) => ({
          step4: { ...state.step4, ...data },
          lastError: null,
        }));

        // TODO: Implement Step 4 API route
      },

      updateStep5: async (data) => {
        // Update local state first
        set((state) => ({
          step5: { ...state.step5, ...data },
          lastError: null,
        }));

        // TODO: Implement Step 5 API route
      },

      updateStep6: async (data) => {
        // Update local state first
        set((state) => ({
          step6: { ...state.step6, ...data },
          lastError: null,
        }));

        // TODO: Implement Step 6 API route
      },

            // Multi-applicant specific functions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updateStep3ForApplicant: async (applicantIndex: number, data: Record<string, unknown>) => {
        // TODO: Implement Step 3 applicant-specific API route
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updateStep4ForApplicant: async (applicantIndex: number, data: Record<string, unknown>) => {
        // TODO: Implement Step 4 applicant-specific API route
      },

      setCurrentStep: (step) => set({ currentStep: step }),

      setApplicationId: (id) => set({ applicationId: id }),

      setGhlContactId: (id) => set({ ghlContactId: id }),

      setGhlOpportunityId: (id) => set({ ghlOpportunityId: id }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 6),
        })),

      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      resetForm: () => set(initialState),

      getProgress: () => {
        const step = get().currentStep;
        const progressMap: Record<number, number> = {
          1: 20,
          2: 40,
          3: 60,
          4: 70,
          5: 85,
          6: 100,
        };
        return progressMap[step] || 0;
      },

      // Database operations
      createNewApplication: async (ghlContactId?: string) => {
        try {
          const result = await createApplication();
          if (result.data) {
            const app = result.data as { id: string };
            set({ 
              applicationId: app.id, 
              ghlContactId: ghlContactId || null,
              lastError: null 
            });
            return app.id;
          } else {
            set({ lastError: result.error || 'Failed to create new application' });
            return null;
          }
        } catch (error) {
          console.error('Error creating application:', error);
          set({ lastError: 'Failed to create new application' });
          return null;
        }
      },

      loadApplication: async (applicationId: string) => {
        try {
          const result = await loadApplicationData(applicationId);
          if (result.data) {
            const formState = transformDatabaseToFormState(result.data);
            if (formState) {
              // Update all form state from database
              set({
                ...formState,
                lastError: null,
              });
              return true;
            }
          }
          set({ lastError: result.error || 'Failed to load application data' });
          return false;
        } catch (error) {
          console.error('Error loading application:', error);
          set({ lastError: 'Failed to load application data' });
          return false;
        }
      },

      saveCurrentProgress: async () => {
        const state = get();
        if (state.applicationId) {
          // This would save the entire current state as progress
          // Implementation depends on how you want to track progress
        }
      },

      // Validation functions
      isStepValid: (stepNumber: number) => {
        const state = get();
        
        switch (stepNumber) {
          case 1:
            const step1Valid = !!(
              state.step1.first_name &&
              state.step1.last_name &&
              state.step1.date_of_birth &&
              state.step1.email &&
              state.step1.mobile
            );

            return step1Valid;
            
          case 2:
            const step2Valid = !!(
              state.step2.nationality &&
              state.step2.marital_status
            );
            // If has co-applicants, ensure at least one co-applicant exists
            if (state.step2.has_co_applicants) {
              return step2Valid && !!(state.step2.co_applicants?.length);
            }
            return step2Valid;
            
          case 3:
            // Check primary applicant
            const primaryStep3Valid = !!(
              state.step3.current_address &&
              state.step3.move_in_date &&
              state.step3.homeowner_or_tenant &&
              state.step3.tax_country &&
              typeof state.step3.monthly_mortgage_or_rent === 'number'
            );
            
            // If has children, check children data
            let childrenValid = true;
            if (state.step3.has_children) {
              childrenValid = !!(state.step3.children?.length);
            }
            
            // Check co-applicants if they exist
            let coApplicantsStep3Valid = true;
            if (state.step2.has_co_applicants && state.step3.co_applicants?.length) {
              coApplicantsStep3Valid = state.step3.co_applicants.every(coApp => 
                !!(coApp.current_address && coApp.move_in_date && coApp.homeowner_or_tenant && coApp.tax_country)
              );
            }
            
            return primaryStep3Valid && childrenValid && coApplicantsStep3Valid;
            
          case 4:
            // Check primary applicant employment
            const primaryStep4Valid = !!(state.step4.employment_status);
            
            // Check co-applicants employment if they exist
            let coApplicantsStep4Valid = true;
            if (state.step2.has_co_applicants && state.step4.co_applicants?.length) {
              coApplicantsStep4Valid = state.step4.co_applicants.every(coApp => 
                !!(coApp.employment_status)
              );
            }
            
            return primaryStep4Valid && coApplicantsStep4Valid;
            
          case 5:
            return true; // Step 5 is optional, so always valid
            
          case 6:
            return !!(
              state.step6.urgency_level &&
              state.step6.purchase_price &&
              state.step6.deposit_available &&
              state.step6.property_address &&
              state.step6.home_status &&
              state.step6.property_type &&
              state.step6.authorization_consent
            );
            
          default:
            return false;
        }
      },
      
      canNavigateToStep: (stepNumber: number) => {
        // Always allow going to step 1
        if (stepNumber === 1) {
          return true;
        }
        
        // For any step > 1, check that all previous steps are valid
        for (let i = 1; i < stepNumber; i++) {
          const isValid = get().isStepValid(i);
          if (!isValid) {
            return false;
          }
        }
        
        return true;
      },

      // Error handling
      setError: (error: string | null) => set({ lastError: error }),
      
      clearError: () => set({ lastError: null }),
    }),
    {
      name: 'aip-form-storage',
      partialize: (state) => ({
        // Only persist form data, not functions
        step1: state.step1,
        step2: state.step2,
        step3: state.step3,
        step4: state.step4,
        step5: state.step5,
        step6: state.step6,
        currentStep: state.currentStep,
        applicationId: state.applicationId,
        ghlContactId: state.ghlContactId,
        ghlOpportunityId: state.ghlOpportunityId,
        lastError: state.lastError,
      }),
    }
  )
);
