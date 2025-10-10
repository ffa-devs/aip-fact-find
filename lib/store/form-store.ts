import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormState } from '@/lib/types/application';
import { 
  createApplication,
  saveStep1Data,
  saveStep2Data,
  saveStep3Data,
  saveStep4Data,
  saveStep5Data,
  saveStep6Data,
  loadApplicationData,
  transformDatabaseToFormState
} from '@/lib/services/supabase-service';

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
          const success = await saveStep1Data(state.applicationId, { ...state.step1, ...data });
          if (!success) {
            set({ lastError: 'Failed to save Step 1 data to database' });
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
          const success = await saveStep2Data(state.applicationId, { ...state.step2, ...data });
          if (!success) {
            set({ lastError: 'Failed to save Step 2 data to database' });
          }
        }
      },

      updateStep3: async (data) => {
        // Update local state first
        set((state) => ({
          step3: { ...state.step3, ...data },
          lastError: null,
        }));

        // Note: Step 3 uses applicant-specific saving via updateStep3ForApplicant
      },

      updateStep4: async (data) => {
        // Update local state first
        set((state) => ({
          step4: { ...state.step4, ...data },
          lastError: null,
        }));

        // Note: Step 4 uses applicant-specific saving via updateStep4ForApplicant
      },

      updateStep5: async (data) => {
        // Update local state first
        set((state) => ({
          step5: { ...state.step5, ...data },
          lastError: null,
        }));

        // Sync to database
        const state = get();
        if (state.applicationId) {
          const success = await saveStep5Data(state.applicationId, { ...state.step5, ...data });
          if (!success) {
            set({ lastError: 'Failed to save Step 5 data to database' });
          }
        }
      },

      updateStep6: async (data) => {
        // Update local state first
        set((state) => ({
          step6: { ...state.step6, ...data },
          lastError: null,
        }));

        // Sync to database
        const state = get();
        if (state.applicationId) {
          const success = await saveStep6Data(state.applicationId, { ...state.step6, ...data });
          if (!success) {
            set({ lastError: 'Failed to save Step 6 data to database' });
          }
        }
      },

      // Multi-applicant specific functions
      updateStep3ForApplicant: async (applicantIndex: number, data: Record<string, unknown>) => {
        const state = get();
        if (state.applicationId) {
          const applicantOrder = applicantIndex + 1; // Convert 0-based index to 1-based order
          const success = await saveStep3Data(state.applicationId, applicantOrder, data);
          if (!success) {
            set({ lastError: `Failed to save Step 3 data for applicant ${applicantOrder}` });
          } else {
            set({ lastError: null });
          }
        }
      },

      updateStep4ForApplicant: async (applicantIndex: number, data: Record<string, unknown>) => {
        const state = get();
        if (state.applicationId) {
          const applicantOrder = applicantIndex + 1; // Convert 0-based index to 1-based order
          const success = await saveStep4Data(state.applicationId, applicantOrder, data);
          if (!success) {
            set({ lastError: `Failed to save Step 4 data for applicant ${applicantOrder}` });
          } else {
            set({ lastError: null });
          }
        }
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
          const application = await createApplication();
          if (application) {
            set({ 
              applicationId: application.id, 
              ghlContactId: ghlContactId || null,
              lastError: null 
            });
            return application.id;
          } else {
            set({ lastError: 'Failed to create new application' });
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
          const dbData = await loadApplicationData(applicationId);
          if (dbData) {
            const formState = transformDatabaseToFormState(dbData);
            if (formState) {
              // Update all form state from database
              set({
                ...formState,
                lastError: null,
              });
              return true;
            }
          }
          set({ lastError: 'Failed to load application data' });
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
          console.log('Saving current progress for application:', state.applicationId);
        }
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
