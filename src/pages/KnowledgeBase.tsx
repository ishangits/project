import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import {
  Upload,
  Plus,
  Search,
  FileText,
  RefreshCw,
  Filter,
  Info,
  Globe,
  Database,
  BookOpen,
  Train,
  Pen,
} from "lucide-react";
import { toast } from "react-toastify";

interface Domain {
  id: string;
  name: string;
  domain: string;
  domainId: string;
}

interface KBEntry {
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

interface DomainEntry {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  created_at: string;
  trainAt: string;
}

interface DomainEntriesResponse {
  pages: DomainEntry[];
  total: number;
  page: number;
  pageSize: number;
}

const KnowledgeBase: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [allEntries, setAllEntries] = useState<KBEntry[]>([]);
  const [domainEntries, setDomainEntries] = useState<DomainEntry[]>([]);
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainEntriesLoading, setDomainEntriesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [domainCurrentPage, setDomainCurrentPage] = useState(1); // Separate page state for domain entries
  const [totalPages, setTotalPages] = useState(1);
  const [domainTotalPages, setDomainTotalPages] = useState(1); // Separate total pages for domain entries
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [url, setUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [urlSubmitProgress, setUrlSubmitProgress] = useState(false);
  const [itemsPerPage] = useState(10);
  const [filteredEntries, setFilteredEntries] = useState<KBEntry[]>([]);
  const [activeView, setActiveView] = useState<"kb" | "domain">("kb");
  const [training, setTraining] = useState(false);

  const fetchDomains = async () => {
    try {
      const response = await apiService.getDomains({ limit: 100 });
      setDomains(response.tenants);
      if (response.tenants.length > 0 && !selectedDomain) {
        setSelectedDomain(response.tenants[0].id);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
    }
  };

  const fetchEntries = async (domainId: string) => {
    if (!domainId) return;

    try {
      setLoading(true);
      const response = await apiService.getKBEntries(domainId);

      let entries: KBEntry[] = [];

      if (Array.isArray(response)) {
        entries = response.map((item: any) => ({
          _id: item.id?.toString(),
          type: "manual",
          question: item.title || "",
          answer: item.content || "",
          content: item.content || "",
          source: item.source,
          metadata: {},
          status: "active",
          createdAt: new Date().toISOString(),
        }));
      } else {
        entries = response.entries || response.rows || [];
      }

      setAllEntries(entries);
      setFilteredEntries(entries);
      setTotalPages(Math.ceil(entries.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching KB entries:", error);
      setAllEntries([]);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDomain = async (tenantId: string, urlId: string) => {
    setTraining(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      const response = await Promise.race([
        apiService.trainDomain({ tenantId, urlId }, token),
      ]);
      toast.success("Training Success");
    } catch (error: any) {
      toast.error(
        error.message ||
        error.response?.data?.message ||
        "Training failed"
      );
    } finally {
      setTraining(false);
    }
  };

  const handleFetchAllDomain = async (tenantId: string, urlId: string) => {
    setTraining(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      const response = await Promise.race([
        apiService.trainDomain({ tenantId, urlId }, token),
      ]);
      toast.success("Training Success");
    } catch (error: any) {
      toast.error(
        error.message ||
        error.response?.data?.message ||
        "Training failed"
      );
    } finally {
      setTraining(false);
    }
  };

  const fetchDomainEntries = async (domainId: string, page: number = 1) => {
    if (!domainId) return;

    try {
      setDomainEntriesLoading(true);
      const response: DomainEntriesResponse = await apiService.getDomainEntries(domainId, page);


      if (response.pages && Array.isArray(response.pages)) {
        setDomainEntries(response.pages);
        setDomainTotalPages(Math.ceil(response.total / response.pageSize));
        setDomainCurrentPage(response.page);
      } else {
        console.error("Unexpected API response structure:", response);
        toast.error("Unexpected data format from server");
        setDomainEntries([]);
      }
    } catch (error) {
      console.error("Error fetching domain entries:", error);
      toast.error("Failed to fetch domain entries");
      setDomainEntries([]);
    } finally {
      setDomainEntriesLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      if (activeView === "kb") {
        fetchEntries(selectedDomain);
      } else {
        fetchDomainEntries(selectedDomain, domainCurrentPage);
      }
    }
  }, [selectedDomain, activeView, domainCurrentPage]);

  useEffect(() => {
    if (!searchTerm && !typeFilter) {
      setFilteredEntries(allEntries);
    } else {
      const filtered = allEntries.filter((entry) => {
        const matchesSearch = searchTerm
          ? entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchTerm.toLowerCase())
          : true;

        const matchesType = typeFilter
          ? entry.source === typeFilter
          : true;

        return matchesSearch && matchesType;
      });

      setFilteredEntries(filtered);
    }
    setTotalPages(Math.ceil(filteredEntries.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchTerm, typeFilter, allEntries]);

  const getPaginatedEntries = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEntries.slice(startIndex, endIndex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    try {
      await apiService.createKBEntry(selectedDomain, formData);
      setShowModal(false);
      setFormData({ question: "", answer: "" });
      fetchEntries(selectedDomain);
      toast.success("Entry added successfully!");
    } catch (error) {
      console.error("Error creating KB entry:", error);
      toast.error("Failed to add entry");
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !uploadFile) return;

    try {
      setUploadProgress(true);
      const result = await apiService.uploadKBFile(selectedDomain, uploadFile);
      toast.success(result.message);
      setShowUploadModal(false);
      setUploadFile(null);
      (e.target as HTMLFormElement).reset();
      fetchEntries(selectedDomain);
    } catch (error: any) {
      console.error("Error uploading KB file:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadProgress(false);
    }
  };

  const mockSubmitUrl = async (domainId: string, url: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Submitting URL: ${url} for domain: ${domainId}`);
        resolve({
          success: true,
          message: "URL submitted successfully. The content will be processed shortly."
        });
      }, 1500);
    });
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !url) return;

    try {
      setUrlSubmitProgress(true);
      const result = await mockSubmitUrl(selectedDomain, url);
      toast.success(result.message);
      setShowUrlModal(false);
      setUrl("");
      fetchEntries(selectedDomain);
    } catch (error: any) {
      console.error("Error submitting URL:", error);
      toast.error(error.message || "URL submission failed");
    } finally {
      setUrlSubmitProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Knowledge Base Management
        </h1>

        <div className="flex flex-col space-y-3">
          {activeView === "domain" && (
            <div className="text-sm text-red-600 font-medium flex items-center">
              <span className="mr-1">*</span>
              Switch to KB Entries to enable these actions
            </div>
          )}

          <div className="flex space-x-3">
            {/* Existing Upload Button (for KB) */}
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!selectedDomain || activeView !== "kb"} // Disabled if NOT on KB view
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </button>

            {/* Existing Add Entry Button (for KB) */}
            <button
              onClick={() => setShowModal(true)}
              disabled={!selectedDomain || activeView !== "kb"} // Disabled if NOT on KB view
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </button>

            {/* New Train All Button (for non-KB views, e.g., Train) */}
            <button
              onClick={() => handleFetchAllDomain(selectedDomain, "all")}
              disabled={!selectedDomain || activeView === "kb"} // Disabled if ON KB view
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Pen className="h-4 w-4 mr-2" /> {/* You'll need a Train icon or choose another */}
              Train All Pages
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Domain (Client's)
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setDomainCurrentPage(1); // Reset to first page when domain changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a domain/client's...</option>
              {domains.map((domain) => (
                <option key={domain.id || domain.name} value={domain.id}>
                  {domain.name} ({domain.domain})
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                if (activeView === "kb") {
                  fetchEntries(selectedDomain);
                } else {
                  fetchDomainEntries(selectedDomain, domainCurrentPage);
                }
              }}
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setActiveView("kb");
              setDomainCurrentPage(1); // Reset to first page when switching views
            }}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${activeView === "kb"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            KB Entries
          </button>
          <button
            onClick={() => {
              setActiveView("domain");
              setCurrentPage(1); // Reset to first page when switching views
            }}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${activeView === "domain"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            <Database className="h-4 w-4 mr-2" />
            Web Pages Entries
          </button>
        </div>
      </div>

      {/* Search and Filter - Only show for KB entries */}
      {activeView === "kb" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="manual">Manual</option>
                <option value="upload">Upload</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {(searchTerm || typeFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading || domainEntriesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedDomain ? (
          <>
            {activeView === "kb" ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedEntries().length > 0 ? (
                        getPaginatedEntries().map((entry) => (
                          <tr key={entry._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.answer || "N/A"}>
                              <div className="font-medium">{entry.question}</div>
                              <div className="text-gray-500">{entry.answer}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.source}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Search className="h-12 w-12 mb-4 text-gray-300" />
                              <h3 className="text-lg font-medium mb-1">
                                No entries found
                              </h3>
                              <p className="text-sm">
                                {(searchTerm || typeFilter)
                                  ? `No results found for your search criteria`
                                  : "No entries available"}
                              </p>
                              {(searchTerm || typeFilter) && (
                                <button
                                  onClick={() => {
                                    setSearchTerm("");
                                    setTypeFilter("");
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

                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-700">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredEntries.length
                        )}{" "}
                        of {filteredEntries.length} results
                        {(searchTerm || typeFilter) && <span> (filtered)</span>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          First Page
                        </button>
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
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          Last Page
                        </button>

                      </div>
                    </div>

                    <div className="flex justify-center mt-2 space-x-2 text-sm text-gray-700">
                      <span>
                        Page <span className="font-medium">{currentPage}</span> of {totalPages}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Domain Entries Table
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TRAIN AT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {domainEntries.length > 0 ? (
                        domainEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                              <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title={entry.url}
                              >
                                {entry.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.title || "N/A"}>
                              {entry.title || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.description || "N/A"}>
                              {entry.description || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.trainAt).toLocaleDateString() || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                              <button
                                onClick={() => handleFetchDomain(selectedDomain, entry.id.toString())}
                                className="px-6 py-4 text-green-600 hover:text-green-900"
                                title="Train Model"
                              >
                                Train
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Search className="h-12 w-12 mb-4 text-gray-300" />
                              <h3 className="text-lg font-medium mb-1">
                                No domain entries found
                              </h3>
                              <p className="text-sm">
                                No domain entries available for this domain
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {domainTotalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-700">
                        Page {domainCurrentPage} of {domainTotalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setDomainCurrentPage(1)}
                          disabled={domainCurrentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          First Page
                        </button>

                        <button
                          onClick={() => setDomainCurrentPage(domainCurrentPage - 1)}
                          disabled={domainCurrentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setDomainCurrentPage(domainCurrentPage + 1)}
                          disabled={domainCurrentPage === domainTotalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          Next
                        </button><button
                          onClick={() => setDomainCurrentPage(domainTotalPages)}
                          disabled={domainCurrentPage === domainTotalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          Last Page
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center mt-2 space-x-2 text-sm text-gray-700">
                      <span>
                        Page <span className="font-medium">{domainCurrentPage}</span> of {domainTotalPages}
                      </span>
                    </div>

                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Please select a domain to view knowledge base entries
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals remain the same */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Add Knowledge Base Entry
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the question"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the answer"
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {training && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          <span className="ml-4 text-white font-medium">
            Training Started...
          </span>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Upload KB File
            </h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File (CSV or Excel)
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Info color="#e60f0f" className="h-3 w-3 mr-1" />
                  File should have 'question' and 'answer' columns.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadProgress}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {uploadProgress ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;