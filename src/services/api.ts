import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";


const TENANT_API_BASE = import.meta.env.VITE_TENANT_API_BASE;
const TENANT_API_KEY = import.meta.env.VITE_TENANT_API_KEY;

class ApiService {
  private api: AxiosInstance;

  constructor() {

    this.api = axios.create({
      baseURL: TENANT_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TENANT_API_KEY,
      },
    });
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const toastMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Unexpected error occurred";

        switch (status) {
          case 400:
            toast.error(toastMessage);
            console.error("Bad Request:", toastMessage);
            console.error("Bad Request:", error.response?.data?.message || "Invalid request");
            break;

          case 401:
            toast.error(toastMessage);
            console.warn("Unauthorized: Logging out user.");
            if (error.config.url?.includes("/api/admin/admin-login/")) {
              break; 
            }
            localStorage.removeItem("token");
            this.logout();
            break;

          case 403:
            toast.error(toastMessage);
            localStorage.removeItem("token");
            this.logout();
            break;

          case 404:
            toast.error(toastMessage);

            console.error("Not Found:", error.response?.data?.message || "Resource not found");
            break;

          case 429:
            console.warn("Too Many Requests: Please slow down.");
            break;

          case 500:
            toast.error(toastMessage);

            console.error("Internal Server Error:", error.response?.data?.message || "Server error, try later");
            break;

          case 503:
            console.error("Service Unavailable: Try again later.");
            break;

          default:
            console.error("Unexpected error:", error.message || "Something went wrong");
        }

        return Promise.reject({
          code: status || "NETWORK_ERROR",
          message:
            status === 401 || status === 403
              ? "Session expired. Please log in again."
              : error.response?.data?.message || "Unexpected error occurred", details: error.response?.data || null,
        });
      }
    );


  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['token'] = `${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['token'];
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/api/admin/admin-login/', { email, password });
    return response.data; 
  }

  logout() {
    localStorage.removeItem("token");
    this.clearAuthToken();
    alert("⚠️ Your session has expired. Please log in again.");
    window.location.href = "/login";
  }

  // Auth endpoints
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    const response = await this.api.post(
      `/api/admin/change-password`,
      { oldPassword: currentPassword, newPassword },
      {
        headers: {
          'Content-Type': 'application/json',
          token,
        },
      }
    );

    return response.data;
  }

  async getDomains(params?: any) {
    const response = await this.api.get('/api/tenants', { params });
    return response.data;
  }

  async getDashboardData() {
    const response = await this.api.get('/api/admin/dashboard-metrics');
    return response.data;
  }

  async getDomain(id: string) {
    const response = await this.api.get(`/domains/${id}`);
    return response.data;
  }

  async createDomain(data: any) {
    const response = await this.api.post('/api/tenants/', data);
    return response.data;
  }

  async trainDomain(payload: { tenantId: string, urlId: string }, token: string) {
    const response = await this.api.post(
      `/api/tenants/train-pages`,
      payload,
      {
        headers: {
          token: token,
        },
      }
    );
    return response.data;
  }
  async fetchDomain(payload: { tenantId: string }, token: string) {
    const response = await this.api.post(
      `/api/tenants/fetch-domain-pages`,
      payload,
      {
        headers: {
          token: token,
        },
      }
    );
    return response.data;
  }


  async updateDomain(data: Record<string, any>) {
    if (!data.id) throw new Error("tenantId is required for updating a domain");
    const response = await this.api.post(`/api/tenants/update-tenant`, data);
    return response.data;
  }

  async getKBEntries(domainId: string, page = 1, limit = 10, search = '', type = '') {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      type
    }).toString();

    const response = await this.api.get(`/api/kb/${domainId}?${query}`);
    return response.data;
  }
  
  async getDomainEntries(domainId: string, page: number) {
    const response = await this.api.get(`/api/tenants/tenant-crawl-pages/${domainId}/${page}`);
    return response.data
  }

  async createKBEntry(
    domainId: string,
    data: { question: string; answer: string; tags?: string }
  ) {
    const payload = {
      tenantId: domainId,
      title: data.question,
      content: data.answer,
    };

    const response = await this.api.post(`/api/kb/`, payload);
    return response.data;
  }



  async uploadKBFile(domainId: string, file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();

    let rows: any[] = [];

    if (ext === "csv") {
      const csvText = await file.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rows = parsed.data as any[];
    } else if (ext === "xlsx" || ext === "xls") {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (ext === "pdf") {
      throw new Error("PDF upload not supported yet in frontend-only mode");
    } else {
      throw new Error("Unsupported file type");
    }

    await this.api.post('/api/kb/bulk/', {
      tenantId: domainId,
      row: rows
    }, {
      headers: { "X-API-Key": TENANT_API_KEY },
    });
    return { message: `Uploaded` };
  }

  async downloadCSVReport(params: any) {
    console.log('Mock CSV download params:', params);
    const csvContent = 'Date,Domain,Tokens,Request Type,Cost\n2025-08-29,Example Domain,100,chat,0.50\n2025-08-28,Another Domain,200,kb_update,1.25';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    return new Promise<Blob>((resolve) => setTimeout(() => resolve(blob), 1000));
  }

  async downloadPDFReport(params: any) {
    console.log('Mock PDF download params:', params);
    const pdfContent = 'Mock PDF Report for Token Usage';
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return new Promise<Blob>((resolve) => setTimeout(() => resolve(blob), 1000));
  }

  async generateInvoice(data: any) {
    console.log('Mock invoice generation data:', data);
    return new Promise<{ invoiceNumber: string }>((resolve) =>
      setTimeout(() => resolve({ invoiceNumber: `INV-MOCK-${Date.now()}` }), 1000)
    );
  }

  async openChatSession(tenantId: string, userId: string) {
    const response = await this.api.post(
      `/v1/open/`,
      { user_id: userId },
      {
        headers: {
          tenantid: tenantId, 
        },
      }
    );
    return response.data; 
  }


  async sendChatMessage(tenantId: string, message: string, sessionId: string | null) {
    const response = await this.api.post(
      `/v1/chat`,
      { message, session_id: sessionId || "6" },
      { headers: { tenantid: tenantId } }
    );
    return response.data;
  }
}

export const apiService = new ApiService();