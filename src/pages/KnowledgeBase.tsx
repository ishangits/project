/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import {
  Upload,
  Plus,
  Search,
  FileText,
  RefreshCw,
  Filter,
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

const KnowledgeBase: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

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

  const fetchEntries = async (
  domainId: string,
  page = 1,
  // search = "",
  // type = ""
) => {
  if (!domainId) return;

  try {
    setLoading(true);
    const response = await apiService.getKBEntries(domainId);

    let entries: KBEntry[] = [];

    if (Array.isArray(response)) {
      // Backend returned a simple array
      entries = response.map((item: any) => ({
        _id: item.id?.toString(),
        // type: "manual", // default since API doesn’t send it
        question: item.title || "",
        answer: item.content || "",
        content: item.content || "",
        source: item.source,
        metadata: {},
        status: "active",
        createdAt: new Date().toISOString(),
      }));
      setTotalPages(1);
      setCurrentPage(1);
    } else {
      // Backend returned paginated object
      entries = response.entries || response.rows || [];
      const total = response.total || response.count || entries.length;
      setTotalPages(response.totalPages || Math.ceil(total / 10));
      setCurrentPage(response.currentPage || page);
    }

    setEntries(entries);
  } catch (error) {
    console.error("Error fetching KB entries:", error);
    setEntries([]);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchEntries(selectedDomain, currentPage);
    }
  }, [selectedDomain, currentPage, searchTerm, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEntries(selectedDomain, 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    try {
      await apiService.createKBEntry(selectedDomain, formData);
      setShowModal(false);
      setFormData({ question: "", answer: "" });
      fetchEntries(selectedDomain, currentPage);
    } catch (error) {
      console.error("Error creating KB entry:", error);
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
    fetchEntries(selectedDomain, currentPage);
  } catch (error: any) {
    console.error("Error uploading KB file:", error);
    toast.error(error.message || "Upload failed");
  } finally {
    setUploadProgress(false);
  }
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Knowledge Base Management
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedDomain}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedDomain}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Domain Selection and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a domain...</option>
              {domains.map((domain) => (
                <option key={domain.id || domain.name} value={domain.id}>
                  {domain.name} ({domain.domain})
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            {/* <button
              onClick={handleCrawl}
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Globe className="h-4 w-4 mr-2" />
              Crawl Domain
            </button> */}
            <button
              onClick={() =>
                fetchEntries(
                  selectedDomain,
                  currentPage,
                )
              }
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col lg:flex-row gap-4"
        >
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
        </form>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedDomain ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
             <tbody className="bg-white divide-y divide-gray-200">
  {Array.isArray(entries) && entries.length > 0 ? (
    entries.map((entry) => (
      <tr key={entry._id}>
        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {entry.type}
        </td> */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="font-medium">{entry.question}</div>
          <div className="text-gray-500">{entry.answer}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {entry.source}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString()}
        </td>
        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => handleDelete(entry._id)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </td> */}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={5} className="text-center py-4 text-gray-500">
        No entries found
      </td>
    </tr>
  )}
</tbody>


              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={Number(currentPage) === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <button
                      onClick={() => setCurrentPage(Number(currentPage) + 1)}
                      disabled={Number(currentPage) === Number(totalPages)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Add Entry Modal */}
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
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="support, contact, help"
                />
              </div> */}
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

      {/* Upload Modal */}
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
                <p className="text-xs text-gray-500 mt-1">
                  File should have 'question' and 'answer' columns (PDFs will
                  extract text automatically)
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
