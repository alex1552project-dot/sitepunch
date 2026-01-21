/**
 * API Service for SitePunch Mobile App
 * Handles all HTTP requests to the backend
 */

// UPDATE THIS URL after deploying to Netlify
const API_BASE_URL = 'https://your-sitepunch-app.netlify.app/api';

class ApiService {
  token = null;

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // ============== AUTH ==============
  async login(companyCode, pin, employeeId) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ companyCode, pin, employeeId }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // ============== TIME TRACKING ==============
  async clockIn(location) {
    return this.request('/time/clock-in', {
      method: 'POST',
      body: JSON.stringify({ location }),
    });
  }

  async clockOut(location) {
    return this.request('/time/clock-out', {
      method: 'POST',
      body: JSON.stringify({ location }),
    });
  }

  async getCurrentStatus() {
    return this.request('/time/status');
  }

  async getTimeEntries(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/time/entries?${params}`);
  }

  async getPayPeriodSummary() {
    return this.request('/time/summary');
  }

  // ============== INCIDENTS ==============
  async reportIncident(incidentData) {
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  async getIncidents() {
    return this.request('/incidents');
  }

  // ============== TIME OFF ==============
  async requestTimeOff(requestData) {
    return this.request('/time-off', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getTimeOffRequests() {
    return this.request('/time-off');
  }

  async cancelTimeOffRequest(id) {
    return this.request(`/time-off/${id}/cancel`, { method: 'POST' });
  }

  // ============== POLICIES ==============
  async getPolicies() {
    return this.request('/policies');
  }

  async acknowledgePolicy(policyId) {
    return this.request(`/policies/${policyId}/acknowledge`, { method: 'POST' });
  }

  async getPendingAcknowledgments() {
    return this.request('/policies/pending');
  }

  // ============== CHAT ==============
  async getChannels() {
    return this.request('/chat/channels');
  }

  async getMessages(channelId, before) {
    const params = before ? `?before=${before}` : '';
    return this.request(`/chat/channels/${channelId}/messages${params}`);
  }

  async sendMessage(channelId, content) {
    return this.request(`/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

const api = new ApiService();
export default api;
