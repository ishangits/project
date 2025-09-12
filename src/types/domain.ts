export interface Domain {
  id: string;
  openai_api_key: string;
  name: string;
  domain: string;
  domainId: string;
  apiEndpoint: string;
  authToken: string;
  knowledgeBaseUpdatedAt: string | null;
  status: string;
  createdAt: string;
  crawled_pages_count: number;
  crawl_status: string | null;
}

export interface FormData {
  id: string;
  name: string;
  domain: string;
  openai_api_key: string;
  status: string;
}

export interface ChatState {
  isOpen: boolean;
  tenantId: string | null;
  sessionId: string | null;
}

export interface EmbedConfig {
  themeColor: string;
  position: string;
  greetingMessage: string;
  showBranding: boolean;
  brandingText: string;
}