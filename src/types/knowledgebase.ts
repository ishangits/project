export interface Domain {
  id: string;
  name: string;
  domain: string;
  domainId: string;
}

export interface KBEntry {
  _id: string;
  type: string;
  question: string;
  answer: string;
  content: string;
  source: string;
  metadata: {
    filename?: string;
    uploadDate?: string;
    crawlDate?: string;
    url?: string;
  };
  status: string;
  createdAt: string;
}

export interface DomainEntry {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  created_at: string;
  trainAt: string;
}

export interface DomainEntriesResponse {
  pages: DomainEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export type ViewType = "kb" | "domain";