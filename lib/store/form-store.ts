import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormState } from '@/lib/types/application';

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
  },
  step4: {
    employment_status: '',
    employment_details: {},
    financial_commitments: {},
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
};

interface FormActions {
  updateStep1: (data: Partial<FormState['step1']>) => void;
  updateStep2: (data: Partial<FormState['step2']>) => void;
  updateStep3: (data: Partial<FormState['step3']>) => void;
  updateStep4: (data: Partial<FormState['step4']>) => void;
  updateStep5: (data: Partial<FormState['step5']>) => void;
  updateStep6: (data: Partial<FormState['step6']>) => void;
  setCurrentStep: (step: number) => void;
  setApplicationId: (id: string) => void;
  setGhlContactId: (id: string) => void; // Add GHL contact ID setter
  setGhlOpportunityId: (id: string) => void; // Add GHL opportunity ID setter
  nextStep: () => void;
  previousStep: () => void;
  resetForm: () => void;
  getProgress: () => number;
}

export const useFormStore = create<FormState & FormActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateStep1: (data) =>
        set((state) => ({
          step1: { ...state.step1, ...data },
        })),

      updateStep2: (data) =>
        set((state) => ({
          step2: { ...state.step2, ...data },
        })),

      updateStep3: (data) =>
        set((state) => ({
          step3: { ...state.step3, ...data },
        })),

      updateStep4: (data) =>
        set((state) => ({
          step4: { ...state.step4, ...data },
        })),

      updateStep5: (data) =>
        set((state) => ({
          step5: { ...state.step5, ...data },
        })),

      updateStep6: (data) =>
        set((state) => ({
          step6: { ...state.step6, ...data },
        })),

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
      }),
    }
  )
);
