/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Papa from "papaparse";
import * as XLSX from "xlsx";

const TENANT_API_BASE = import.meta.env.VITE_TENANT_API_BASE;
const TENANT_API_KEY = import.meta.env.VITE_TENANT_API_KEY;

class ApiService {
  private api: AxiosInstance;

  constructor() {

    this.api = axios.create({
 baseURL: TENANT_API_BASE,
       headers: {
        'Content-Type': 'application/json',
              'X-API-Key': TENANT_API_KEY, // ⚠ Exposed in frontend

      },
    });

    // Response interceptor for error handling
  // api.ts
this.api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Instead of redirecting immediately
      localStorage.removeItem('token');
      // Optionally: set a flag or throw
      return Promise.reject({ ...error, code: 401 });
    }
    return Promise.reject(error);
  }
);

  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['token'] = `${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['token'];
  }

  // Auth endpoints
 async login(email: string, password: string) {
    const response = await this.api.post('/api/admin/admin-login/', { email, password });
    return response.data; // token + admin info
  }

  
//  async verifyToken() {
//   const response = await this.api.get('/api/admin/verify');
//   return response.data;
// }

  // async logout() {
  //   const response = await this.api.post('/auth/logout');
  //   return response.data;
  // }
// Auth endpoints
async changePassword(token: string, currentPassword: string, newPassword: string) {
  const response = await this.api.post(
    `/api/admin/change-password`,
    { oldPassword: currentPassword, newPassword },
    {
      headers: {
        'Content-Type': 'application/json',
        token, // send JWT in `token` header
        Authorization: 'Basic am95c2NvcmU6am95c2NvcmU=', // same as curl
      },
    }
  );

  return response.data;
}



  // Domain endpoints
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

async trainModel(payload: { tenantId: string }, token: string) {
  const response = await this.api.post(
    `/api/admin/ingest/all/`,
    payload,
    {
      headers: {
        token: token, 
                Authorization: undefined, // override default Authorization

      },
    }
  );
  return response.data;
}


async updateDomain(data: {
  id: string;
  name?: string;
  domain?: string;
  status?: string;
  dbIP?: string;
  dbPort?: number | string;
  dbUserName?: string;
  dbPass?: string;
  dbName?: string;
  apiKey?: string;
}) {
  if (!data.id) throw new Error("tenantId is required for updating a domain");

  // 🔑 Map to backend-expected keys
  const payload = {
  id: data.id,
  name: data.name || "",
  domain: data.domain || "",
  status: data.status
    ? data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase()
    : "Active",
  dbIP: data.dbIP || "",
  dbPort: data.dbPort ? Number(data.dbPort) : 3306,
  dbUserName: data.dbUserName || "",
  dbPass: data.dbPass || "",
  dbName: data.dbName || "",
  apiKey: data.apiKey || "",
};


  const response = await this.api.post(`/api/tenants/update-tenant`, payload);
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
    // Parse CSV
    const csvText = await file.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    rows = parsed.data as any[];
  } else if (ext === "xlsx" || ext === "xls") {
    // Parse Excel
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else if (ext === "pdf") {
    // Optional: PDF parsing logic
    throw new Error("PDF upload not supported yet in frontend-only mode");
  } else {
    throw new Error("Unsupported file type");
  }

  // let successCount = 0;
await this.api.post('/api/kb/bulk/', {
        tenantId: domainId,
        row: rows
        // title: question,
        // content: answer,
      }, {
        headers: { "X-API-Key": TENANT_API_KEY },
      });
  // for (const row of rows) {
  //   const question = row.question || row.Question;
  //   const answer = row.answer || row.Answer;
  //   if (!question || !answer) continue;

  //   try {

  //     successCount++;
  //   } catch (err) {
  //     console.error("Failed to push KB entry:", row, err);
  //   }
  // }

  return { message: `Uploaded`};
}
// ------------------ Reports / Mocked ------------------
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

  async sendChatMessage(tenantId: string, message: string, sessionId: string | null) {
  const response = await this.api.post(
    `/v1/chat`,
    {
      message,
      session_id: sessionId || "6",
    },
    {
      headers: {
        tenantid: tenantId,
        // X-API-Key and Content-Type already included by default in constructor
      },
    }
  );
  return response.data;
}

  // async deleteKBEntry(domainId: string, entryId: string) {
  //   const response = await this.api.delete(`/kb/${domainId}/entries/${entryId}`);
  //   return response.data;
  // }

  // async crawlDomain(domainId: string) {
  //   const response = await this.api.post(`/kb/${domainId}/crawl`);
  //   return response.data;
  // }

  // Token Usage endpoints
//   async getTokenUsage(params?: any) {
//     const response = await this.api.get('/tokens', { params });
//     return response.data;
//   }

//   async getTokenStats(params?: any) {
//     const response = await this.api.get('/tokens/stats', { params });
//     return response.data;
//   }

//   async createTokenLog(data: any) {
//     const response = await this.api.post('/tokens', data);
//     return response.data;
//   }

//   // Reports endpoints
//   async downloadCSVReport(params?: any) {
//     const response = await this.api.get('/reports/csv', {
//       params,
//       responseType: 'blob',
//     });
//     return response.data;
//   }

//   async downloadPDFReport(params?: any) {
//     const response = await this.api.get('/reports/pdf', {
//       params,
//       responseType: 'blob',
//     });
//     return response.data;
//   }

//   async generateInvoice(data: any) {
//     const response = await this.api.post('/reports/invoice', data);
//     return response.data;
//   }

//   // Invoice endpoints
//   async getClientInvoices(domainId: string, params?: any) {
//     const response = await this.api.get(`/clients/${domainId}/invoices`, { params });
//     return response.data;
//   }

//   async createInvoice(domainId: string, data: any) {
//     const response = await this.api.post(`/clients/${domainId}/invoices`, data);
//     return response.data;
//   }

//   async updateInvoiceStatus(invoiceId: string, data: any) {
//     const response = await this.api.put(`/invoices/${invoiceId}`, data);
//     return response.data;
//   }

//   async getInvoice(invoiceId: string) {
//     const response = await this.api.get(`/invoices/${invoiceId}`);
//     return response.data;
//   }

//   async deleteInvoice(invoiceId: string) {
//     const response = await this.api.delete(`/invoices/${invoiceId}`);
//     return response.data;
//   }

//   async getInvoiceStats(params?: any) {
//     const response = await this.api.get('/invoices/stats/summary', { params });
//     return response.data;
//   }

//   async revealOpenAIKey(domainId: string) {
//   const response = await this.api.post(`/domains/${domainId}/reveal-key`);
//   return response.data; // expected to return { openAIKey: string }
// }

}

export const apiService = new ApiService();