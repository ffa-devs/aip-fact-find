/**
 * Client-side API service for form data operations
 * Replaces direct Supabase calls with API routes
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: string;
}

/**
 * Create a new application
 */
export async function createApplication(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in createApplication:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Load application data
 */
export async function loadApplicationData(applicationId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/applications?id=${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in loadApplicationData:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Save Step 1 data
 */
export async function saveStep1Data(applicationId: string, step1Data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/applications/step1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId, step1Data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in saveStep1Data:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Save Step 2 data
 */
export async function saveStep2Data(applicationId: string, step2Data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/applications/step2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId, step2Data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in saveStep2Data:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Update application metadata
 */
export async function updateApplication(applicationId: string, updates: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/applications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in updateApplication:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Update application with GHL contact ID
 */
export async function updateApplicationWithGhlId(applicationId: string, ghlContactId: string, ghlOpportunityId?: string): Promise<ApiResponse> {
  const updates: Record<string, unknown> = { 
    ghl_contact_id: ghlContactId 
  };
  
  // Add opportunity ID if provided (migration 004 adds this column)
  if (ghlOpportunityId) {
    updates.ghl_opportunity_id = ghlOpportunityId;
  }
  
  return updateApplication(applicationId, updates);
}

/**
 * Generic step data saver (for steps 3-6 that need simpler handling)
 */
export async function saveStepData(step: number, applicationId: string, stepData: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/applications/step${step}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId, stepData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error in saveStep${step}Data:`, error);
    return { error: 'Network error - please check your connection' };
  }
}

// =====================================================
// CO-APPLICANTS API FUNCTIONS
// =====================================================

/**
 * Create a new co-applicant
 */
export async function createCoApplicant(applicationId: string, coApplicantData: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/co-applicants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ application_id: applicationId, ...coApplicantData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error creating co-applicant:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Get all co-applicants for an application
 */
export async function getCoApplicants(applicationId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/co-applicants?application_id=${applicationId}`);

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching co-applicants:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Update a co-applicant
 */
export async function updateCoApplicant(coApplicantId: string, coApplicantData: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/co-applicants/${coApplicantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coApplicantData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error updating co-applicant:', error);
    return { error: 'Network error - please check your connection' };
  }
}

/**
 * Delete a co-applicant
 */
export async function deleteCoApplicant(coApplicantId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/co-applicants/${coApplicantId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error, details: errorData.details };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error deleting co-applicant:', error);
    return { error: 'Network error - please check your connection' };
  }
}