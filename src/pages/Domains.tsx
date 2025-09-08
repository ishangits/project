import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import {
  Plus,
  Search,
  Edit3,
  ExternalLink,
  Globe,
  Calendar,
  Code,
  Clipboard,
} from "lucide-react";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import ChatbotWidget from "./ChatbotWidget";
import debounce from "lodash.debounce";


interface ChatState {
  isOpen: boolean;
  tenantId: string | null;
  sessionId: string | null;
}

interface FormData {
  id: string;
  name: string;
  domain: string;
  openai_api_key: string;
  status: string;
}
interface Domain {
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
}

const Domains: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [allDomains, setAllDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [training, setTraining] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [itemsPerPage] = useState(10);
  const [apiKeyTouched, setApiKeyTouched] = useState(false);


  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    tenantId: null,
    sessionId: null,
  });
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    domain: "",
    openai_api_key: "",
    status: "Active",
  });
  //embedded snippet
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedDomainForEmbed, setSelectedDomainForEmbed] =
    useState<Domain | null>(null);
  const [embedConfig, setEmbedConfig] = useState({
    themeColor: "#667eea",
    position: "bottom-right",
    greetingMessage: "Hello! How can I help you today?",
    showBranding: true,
    brandingText: "YourCompany",
  });

  const EmbedModal = ({
    domain,
    config,
    onConfigChange,
    onClose,
  }: {
    domain: Domain;
    config: any;
    onConfigChange: (config: any) => void;
    onClose: () => void;
  }) => {
    const [copied, setCopied] = useState(false);
    const embedCode = generateEmbedCode(domain);
    const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage);
    const [brandingText, setBrandingText] = useState(config.brandingText);

    const debouncedUpdate = useCallback(
      debounce((field: string, value: string) => {
        onConfigChange({
          ...config,
          [field]: value,
        });
      }, 1000),
      [config, onConfigChange]
    );

    useEffect(() => {
      setGreetingMessage(config.greetingMessage);
      setBrandingText(config.brandingText);
    }, [config.greetingMessage, config.brandingText]);


    const handleCopy = async () => {
      const success = await copyToClipboard(embedCode);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Embed code copied to clipboard!');
      } else {
        toast.error('Failed to copy embed code');
      }
    };


    const copyToClipboard = async (text: string) => {
      try {
        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        } else {
          // Fallback for older browsers or insecure contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
          } catch (err) {
            document.body.removeChild(textArea);
            return false;
          }
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Embed Chatbot - {domain.name}
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Configuration</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <input
                    type="color"
                    value={config.themeColor}
                    onChange={(e) =>
                      onConfigChange({ ...config, themeColor: e.target.value })
                    }
                    className="w-full h-10 p-1 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={config.position}
                    onChange={(e) =>
                      onConfigChange({ ...config, position: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Greeting Message
                  </label>
                  <input
                    type="text"
                    value={greetingMessage}
                    onChange={(e) => {
                      setGreetingMessage(e.target.value); // live typing
                      debouncedUpdate("greetingMessage", e.target.value); // preview update
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showBranding"
                    checked={config.showBranding}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        showBranding: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor="showBranding"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Show Branding
                  </label>
                </div>

                {config.showBranding && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branding Text
                    </label>
                    <input
                      type="text"
                      value={brandingText}
                      onChange={(e) => {
                        setBrandingText(e.target.value); // live typing
                        debouncedUpdate("brandingText", e.target.value); // preview update
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="YourCompany (default)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Live Preview</h4>
              <div className="border rounded-md p-4 h-64 bg-gray-50 relative overflow-hidden">
                <div className="relative h-full">
                  {/* Preview Chat Toggle Button */}
                  <div
                    className="absolute"
                    style={{
                      [config.position.includes("right") ? "right" : "left"]:
                        "10px",
                      [config.position.includes("bottom") ? "bottom" : "top"]:
                        "10px",
                      width: "40px",
                      height: "40px",
                      background: config.themeColor,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      zIndex: 10,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                        fill="white"
                      />
                    </svg>
                  </div>

                  <div
                    className="absolute"
                    style={{
                      [config.position.includes("right") ? "right" : "left"]:
                        "10px",
                      [config.position.includes("bottom") ? "bottom" : "top"]:
                        "60px",
                      width: "280px",
                      height: "220px",
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      zIndex: 9,
                      border: "1px solid #e1e8ed",
                    }}
                  >
                    <div
                      className="p-3 flex justify-between items-center"
                      style={{ background: config.themeColor, color: "white" }}
                    >
                      <span className="text-sm font-medium">Chat Support</span>
                      <button className="text-white opacity-80 text-lg">
                        ×
                      </button>
                    </div>

                    <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
                      <div className="space-y-2">
                        {/* Bot message preview */}
                        <div className="flex flex-col items-start max-w-[80%]">
                          <div
                            className="px-3 py-2 rounded-2xl text-sm"
                            style={{
                              background: "#e9ecef",
                              borderBottomLeftRadius: "4px",
                            }}
                          >
                            {config.greetingMessage}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-t bg-white flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-full outline-none"
                        disabled
                      />
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: config.themeColor }}
                        disabled
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="white"
                          viewBox="0 0 24 24"
                        >
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>

                    {config.showBranding && (
                      <div className="px-2 py-1 text-center text-xs text-gray-500 border-t bg-gray-50">
                        Powered by <strong>{config.brandingText || "YourCompany"}</strong>

                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                <p>Position: {config.position}</p>
                <p>
                  Color: <span className="font-mono">{config.themeColor}</span>
                </p>
                {config.showBranding && (
                  <p>Branding: {config.brandingText || "YourCompany"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Embed Code</h4>
              <button
                onClick={handleCopy}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                {copied ? "Copied!" : "Copy Code"}
                <Clipboard className="h-4 w-4 ml-1" />
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
              {embedCode}
            </pre>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleEmbedClick = (domain: Domain) => {
    setSelectedDomainForEmbed(domain);
    setShowEmbedModal(true);
  };

  const generateEmbedCode = (domain: Domain) => {
    return `
<!-- Start of Chatbot Widget -->
<div id="chatbot-widget-container"></div>
<script>
  (function() {
    var chatbotConfig = {
      tenantId: "${domain.id}",
      themeColor: "${embedConfig.themeColor}",
      position: "${embedConfig.position}",
      greetingMessage: "${embedConfig.greetingMessage}",
      brandingText: "${embedConfig.brandingText || "YourCompany"}"
    };
    
    // Load chatbot script
    var script = document.createElement('script');
    script.src = 'http://65.2.3.52/chatbot/chatbot-widget.js';
    script.onload = function() {
      window.initChatbotWidget(chatbotConfig);
    };
    document.head.appendChild(script);
  })();
</script>
<!-- End of Chatbot Widget -->
  `.trim();
  };

  const handleChatClick = async (tenantId: string) => {
    try {
      const randomUserId = Math.floor(Math.random() * 10000).toString();

      const { session_id } = await apiService.openChatSession(
        tenantId,
        randomUserId
      );

      setChatState({ tenantId, sessionId: session_id, isOpen: true });
    } catch (error) {
      console.error("Failed to open chat session:", error);
      toast.error("Failed to open chat session");
    }
  };

  const handleChatClose = () => {
    setChatState({
      isOpen: false,
      tenantId: null,
      sessionId: null,
    });
  };

  const fetchDomains = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getDomains({
        page,
        limit: itemsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setAllDomains(response.tenants);
      setDomains(response.tenants);
      setFilteredDomains(response.tenants);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage || page);
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to fetch domains");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchDomains(currentPage);
  }, [currentPage]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate API key if it's touched or for a new domain
  if ((!editingDomain || apiKeyTouched) && formData.openai_api_key && !isValidApiKey(formData.openai_api_key)) {
    toast.error("Please enter a valid OpenAI API key format (typically starts with sk-...)");
    return;
  }

  try {
    const fieldMap: Record<string, string> = {
      name: "name",
      domain: "domain",
      status: "status",
      openai_api_key: "apiKey",
    };

    const payload: any = {};

    // Map all form fields
    Object.keys(fieldMap).forEach((key) => {
      const value = formData[key as keyof typeof formData];

      if (key === "openai_api_key") {
        if (value && isValidApiKey(value)) {
          payload[fieldMap[key]] = value;
        }
        return;
      }

      if (value !== undefined) {
        payload[fieldMap[key]] = value;
      }
    });

    // Ensure status defaults to "Active" for new domains
    if (!editingDomain) {
      payload.status = payload.status || "Active";
      await apiService.createDomain(payload);
      toast.success("Domain created successfully!");
    } else {
      const { id} = formData;
      const payloadToUpdate = {...payload, id};

      const {domain, name, status, ...rest} = payloadToUpdate;
        await apiService.updateDomain(rest);
  toast.success("Domain updated successfully!");
    }

    // Reset form
    setShowModal(false);
    setEditingDomain(null);
    setFormData({
      id: "",
      name: "",
      domain: "",
      openai_api_key: "",
      status: "Active",
    });

    fetchDomains(currentPage);
  } catch (error: any) {
    console.error("Error saving domain:", error);
    toast.error(error?.response?.data?.message || "Failed to save domain");
  }
};


  const isValidApiKey = (key: string): boolean => {
    const apiKeyRegex = /^sk-[a-zA-Z0-9_-]{20,}$/;
    return apiKeyRegex.test(key);
  }

  const isEncryptedApiKey = (key: string): boolean => {
    return key.includes(":") && !isValidApiKey(key);
  };

  const handleFetchDomain = async (domainId: string) => {
    setTraining(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      const response = await Promise.race([
        apiService.fetchDomain({ tenantId: domainId }, token),
      ]);
      toast.success("Domain fetched");
    } catch (error: any) {
      toast.error(
        error.message ||
        error.response?.data?.message ||
        "Fetching Domain failed"
      );
    } finally {
      setTraining(false);
    }
  };

  const getPaginatedDomains = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDomains.slice(startIndex, endIndex);
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setApiKeyTouched(false);
    const apiKeyValue = isEncryptedApiKey(domain.openai_api_key)
      ? ""
      : domain.openai_api_key;
    setFormData({
      id: domain.id,
      name: domain.name,
      domain: domain.domain,
      status: domain.status,
      openai_api_key: apiKeyValue,
    });
    setShowModal(true);
  };

  const openModal = () => {
    setEditingDomain(null);
    setFormData({
      id: "",
      name: "",
      domain: "",
      openai_api_key: "",
      status: "Active",
    });
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
        <button
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const value = e.target.value.toLowerCase();

                if (!value) {
                  setFilteredDomains(allDomains);
                  setCurrentPage(1);
                  setTotalPages(Math.ceil(allDomains.length / itemsPerPage));
                } else {
                  const filtered = allDomains.filter(
                    (d) =>
                      d.name.toLowerCase().includes(value) ||
                      d.domain.toLowerCase().includes(value)
                  );
                  setFilteredDomains(filtered);
                  setCurrentPage(1);
                  setTotalPages(Math.ceil(filtered.length / itemsPerPage));
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilteredDomains(allDomains);
                setCurrentPage(1);
                setTotalPages(Math.ceil(allDomains.length / itemsPerPage));
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KB Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fetch All Web Pages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedDomains().length > 0 ? (
                    getPaginatedDomains().map((domain) => (
                      <tr
                        key={domain.id || domain.name}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {domain.name.toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <a
                                  href={domain.domain}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {domain.domain}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${domain.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : domain.status === "inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {domain.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {domain?.knowledgeBaseUpdatedAt
                                ? new Date(
                                  domain?.knowledgeBaseUpdatedAt
                                ).toLocaleDateString()
                                : "Never"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                          <button
                            onClick={() => handleFetchDomain(domain.id)}
                            className="px-6 py-4 text-green-600 hover:text-green-900"
                            title="Crawl Domain"
                          >
                            Fetch Web Pages
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEdit(domain)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Domain"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleChatClick(domain.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Open Chat"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleEmbedClick(domain)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Embed Chatbot"
                            >
                              <Code className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Search className="h-12 w-12 mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-1">
                            No domains found
                          </h3>
                          <p className="text-sm">
                            {searchTerm
                              ? `No results found for "${searchTerm}"`
                              : "No domains available"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setFilteredDomains(allDomains);
                                setCurrentPage(1);
                                setTotalPages(
                                  Math.ceil(allDomains.length / itemsPerPage)
                                );
                              }}
                              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {training && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                <span className="ml-4 text-white font-medium">
                  Crawling Domain...
                </span>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredDomains.length
                    )}{" "}
                    of {filteredDomains.length} results
                    {searchTerm && <span> for "{searchTerm}"</span>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Page numbers */}
                <div className="flex justify-center mt-2 space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 text-xs rounded ${currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[650px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingDomain ? "Edit Domain" : "Add New Domain"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
readOnly={!!editingDomain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name:
                        e.target.value.charAt(0).toUpperCase() +
                        e.target.value.slice(1),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="domain"
                  required
                  value={formData.domain}
                  readOnly={!!editingDomain}

                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI Key
                </label>
                <input
                  type="text"
                  placeholder={
                    editingDomain && !apiKeyTouched
                      ? "******************************************"
                      : "Enter OpenAI Key (starts with sk-...)"
                  } value={formData.openai_api_key}
                  onChange={(e) => {
                    setFormData({ ...formData, openai_api_key: e.target.value });
                    setApiKeyTouched(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                {editingDomain && !apiKeyTouched && (
                  <p className="text-xs text-gray-500 mt-1">
                    API key is encrypted. Leave as it is to keep current key or enter a new one.
                  </p>
                )}
                {apiKeyTouched && formData.openai_api_key && !isValidApiKey(formData.openai_api_key) && (
                  <p className="text-xs text-red-500 mt-1">
                    This doesn't look like a valid OpenAI API key format.
                  </p>
                )}
              </div>
              {/* Status below DB Info */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  disabled={!!editingDomain} 
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    disabled={
              !!editingDomain && (!apiKeyTouched || !formData.openai_api_key) // 🚫 disable until key typed
            }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingDomain ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {chatState.isOpen && chatState.tenantId && chatState.sessionId && (
        <ChatbotWidget
          tenantId={chatState.tenantId}
          sessionId={chatState.sessionId} // <- important
          isOpen={chatState.isOpen}
          onClose={handleChatClose}
        />
      )}

      {showEmbedModal && selectedDomainForEmbed && (
        <EmbedModal
          domain={selectedDomainForEmbed}
          config={embedConfig}
          onConfigChange={setEmbedConfig}
          onClose={() => {
            setShowEmbedModal(false);
            setSelectedDomainForEmbed(null);
          }}
        />
      )}
    </div>
  );
};

export default Domains;
