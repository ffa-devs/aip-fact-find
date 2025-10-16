/**
 * GoHighLevel API Client
 * 
 * This client handles all interactions with the GoHighLevel API v2
 * using OAuth 2.0 tokens stored in Supabase with automatic refresh
 */

import { getValidAccessToken, getDefaultLocationId } from './oauth';

// GHL API Configuration
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28'; // API version header

export interface GHLContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  tags?: string[];
  // customFields?: Array<{ id: string; key: string; field_value: string | number | boolean }>; // TODO: Map custom fields in settings
  source?: string;
}

export interface GHLContactResponse {
  contact: {
    id: string;
    locationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    tags: string[];
  };
}

export interface GHLContactSearchResponse {
  contacts: Array<{
    id: string;
    locationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    tags: string[];
    dateOfBirth?: string;
  }>;
  total: number;
}

export interface GHLUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  tags?: string[];
  // customFields?: Array<{ id: string; key: string; field_value: string | number | boolean }>; // TODO: Map custom fields in settings
  source?: string;
}

export interface GHLOpportunity {
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  contactId: string;
  monetaryValue?: number;
  assignedTo?: string;
  source?: string;
}

export interface GHLOpportunityResponse {
  opportunity: {
    id: string;
    name: string;
    pipelineId: string;
    pipelineStageId: string;
    status: string;
    contactId: string;
  };
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  position: number;
}

export interface GHLPipelineResponse {
  pipeline: {
    id: string;
    name: string;
    stages: GHLPipelineStage[];
  };
}

class GoHighLevelClient {
  private locationId: string | null = null;

  constructor(locationId?: string) {
    this.locationId = locationId || null;
  }

  /**
   * Get authorization headers with OAuth access token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Get location ID (use provided or get default)
    const locationId = this.locationId || await getDefaultLocationId();
    
    if (!locationId) {
      throw new Error('No GHL location ID available. Please complete OAuth setup first.');
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(locationId);

    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': GHL_API_VERSION,
    };
  }

  /**
   * Search for a contact by email
   */
  async searchContactByEmail(email: string): Promise<GHLContactSearchResponse | null> {
    try {
      const headers = await this.getAuthHeaders();
      const locationId = this.locationId || await getDefaultLocationId();

      const response = await fetch(`${GHL_API_BASE}/contacts/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          locationId,
          pageLimit: 1,
          filters: [
            {
              field: 'email',
              operator: 'eq',
              value: email,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Search Error:', error);
        return null;
      }

      const result = await response.json();
      console.log('🔍 Contact search result:', result);
      return result;
    } catch (error) {
      console.error('Failed to search GHL contact:', error);
      return null;
    }
  }

  /**
   * Create a new contact in GHL
   */
  async createContact(data: GHLContact): Promise<GHLContactResponse | null> {
    try {
      const headers = await this.getAuthHeaders();
      const locationId = this.locationId || await getDefaultLocationId();

      const response = await fetch(`${GHL_API_BASE}/contacts/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          locationId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          tags: data.tags || [],
          // customFields: data.customFields || [], // TODO: Map custom fields
          source: data.source || 'AIP Application',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL API Error:', error);
        throw new Error(`GHL API returned ${response.status}: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Contact created in GHL:', result.contact.id);
      return result;
    } catch (error) {
      console.error('Failed to create GHL contact:', error);
      return null;
    }
  }

  /**
   * Update an existing contact in GHL
   */
  async updateContact(
    contactId: string,
    data: GHLUpdateData
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      // Build update payload - only include fields that are provided
      const updatePayload: Partial<GHLContact> & { tags?: string[] } = {};
      
      if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
      if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.dateOfBirth !== undefined) updatePayload.dateOfBirth = data.dateOfBirth;
      if (data.tags !== undefined) updatePayload.tags = data.tags;
      if (data.source !== undefined) updatePayload.source = data.source;

      console.log('🔄 Updating GHL contact', contactId, 'with payload:', updatePayload);

      const response = await fetch(
        `${GHL_API_BASE}/contacts/${contactId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Update Error:', error);
        return false;
      }

      const result = await response.json();
      console.log('✅ Contact updated in GHL:', contactId, result);
      return true;
    } catch (error) {
      console.error('Failed to update GHL contact:', error);
      return false;
    }
  }

  /**
   * Add tags to a contact
   */
  async addTags(contactId: string, tags: string[]): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${GHL_API_BASE}/contacts/${contactId}/tags`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ tags }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Add Tags Error:', error);
        return false;
      }

      console.log('✅ Tags added to GHL contact:', contactId, tags);
      return true;
    } catch (error) {
      console.error('Failed to add tags to GHL contact:', error);
      return false;
    }
  }

  /**
   * Remove tags from a contact
   */
  async removeTags(contactId: string, tags: string[]): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${GHL_API_BASE}/contacts/${contactId}/tags`,
        {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ tags }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Remove Tags Error:', error);
        return false;
      }

      console.log('✅ Tags removed from GHL contact:', contactId, tags);
      return true;
    } catch (error) {
      console.error('Failed to remove tags from GHL contact:', error);
      return false;
    }
  }
  /**
   * Create an opportunity
   */
  async createOpportunity(data: GHLOpportunity): Promise<GHLOpportunityResponse | null> {
    try {
      const headers = await this.getAuthHeaders();
      const locationId = this.locationId || await getDefaultLocationId();

      const response = await fetch(
        `${GHL_API_BASE}/opportunities/`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            locationId,
            name: data.name,
            pipelineId: data.pipelineId,
            pipelineStageId: data.pipelineStageId,
            status: data.status,
            contactId: data.contactId,
            monetaryValue: data.monetaryValue,
            assignedTo: data.assignedTo,
            source: data.source || 'AIP Application',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Create Opportunity Error:', error);
        throw new Error(`Failed to create opportunity: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Opportunity created in GHL:', result.opportunity.id);
      return result;
    } catch (error) {
      console.error('Failed to create GHL opportunity:', error);
      return null;
    }
  }

  /**
   * Update an opportunity stage
   */
  async updateOpportunityStage(
    opportunityId: string,
    stageId: string
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${GHL_API_BASE}/opportunities/${opportunityId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            pipelineStageId: stageId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Update Opportunity Error:', error);
        return false;
      }

      console.log('✅ Opportunity stage updated:', opportunityId);
      return true;
    } catch (error) {
      console.error('Failed to update opportunity stage:', error);
      return false;
    }
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(
    opportunityId: string,
    status: 'open' | 'won' | 'lost' | 'abandoned'
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${GHL_API_BASE}/opportunities/${opportunityId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL Update Opportunity Status Error:', error);
        return false;
      }

      console.log('✅ Opportunity status updated:', opportunityId, status);
      return true;
    } catch (error) {
      console.error('Failed to update opportunity status:', error);
      return false;
    }
  }
}

// Export singleton instance (no location ID - will use default from Supabase)
export const ghlClient = new GoHighLevelClient();
