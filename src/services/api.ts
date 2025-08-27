/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async verifyToken() {
    const response = await this.api.get('/auth/verify');
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  // Domain endpoints
  async getDomains(params?: any) {
    const response = await this.api.get('/tenants', { params });
    return response.data;
  }

  async getDomain(id: string) {
    const response = await this.api.get(`/domains/${id}`);
    return response.data;
  }

  async createDomain(data: any) {
    const response = await this.api.post('/tenants', data);
    return response.data;
  }

// api.ts
async trainModel(payload: { tenantId: string }) {
  const response = await this.api.post(`/train`, payload);
  return response.data;
}

 async updateDomain(data: any) {
  const response = await this.api.post(`/tenants`, data);  // just `/tenants`
  return response.data;
}


  async deleteDomain(id: string) {
    const response = await this.api.delete(`/domains/${id}`);
    return response.data;
  }

  async updateDomainKB(id: string) {
    const response = await this.api.post(`/domains/${id}/kb-update`);
    return response.data;
  }

  // Knowledge Base endpoints
  async getKBEntries(domainId: string, params?: any) {
    const response = await this.api.get(`/kb/${domainId}`, { params });
    return response.data;
  }

 async createKBEntry(domainId: string, data: { question: string; answer: string; tags?: string }) {
  // map question → title, answer → content
  const payload = {
    tenantId: domainId,
    title: data.question,
    content: data.answer,
    // tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
  };

  const response = await this.api.post(`/kb`, payload);
  return response.data;
}


  async uploadKBFile(domainId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post(`/kb/${domainId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteKBEntry(domainId: string, entryId: string) {
    const response = await this.api.delete(`/kb/${domainId}/entries/${entryId}`);
    return response.data;
  }

  async crawlDomain(domainId: string) {
    const response = await this.api.post(`/kb/${domainId}/crawl`);
    return response.data;
  }

  // Token Usage endpoints
  async getTokenUsage(params?: any) {
    const response = await this.api.get('/tokens', { params });
    return response.data;
  }

  async getTokenStats(params?: any) {
    const response = await this.api.get('/tokens/stats', { params });
    return response.data;
  }

  async createTokenLog(data: any) {
    const response = await this.api.post('/tokens', data);
    return response.data;
  }

  // Reports endpoints
  async downloadCSVReport(params?: any) {
    const response = await this.api.get('/reports/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async downloadPDFReport(params?: any) {
    const response = await this.api.get('/reports/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async generateInvoice(data: any) {
    const response = await this.api.post('/reports/invoice', data);
    return response.data;
  }

  // Invoice endpoints
  async getClientInvoices(domainId: string, params?: any) {
    const response = await this.api.get(`/clients/${domainId}/invoices`, { params });
    return response.data;
  }

  async createInvoice(domainId: string, data: any) {
    const response = await this.api.post(`/clients/${domainId}/invoices`, data);
    return response.data;
  }

  async updateInvoiceStatus(invoiceId: string, data: any) {
    const response = await this.api.put(`/invoices/${invoiceId}`, data);
    return response.data;
  }

  async getInvoice(invoiceId: string) {
    const response = await this.api.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  async deleteInvoice(invoiceId: string) {
    const response = await this.api.delete(`/invoices/${invoiceId}`);
    return response.data;
  }

  async getInvoiceStats(params?: any) {
    const response = await this.api.get('/invoices/stats/summary', { params });
    return response.data;
  }

  async revealOpenAIKey(domainId: string) {
  const response = await this.api.post(`/domains/${domainId}/reveal-key`);
  return response.data; // expected to return { openAIKey: string }
}

}

export const apiService = new ApiService();