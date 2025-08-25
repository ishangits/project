/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Globe,
  Calendar,
  RefreshCw,
  Eye,
} from "lucide-react";

interface Domain {
  id: string;
  openAIKey: string;
  name: string;
  url: string;
  domainId: string;
  apiEndpoint: string;
  authToken: string;
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbDatabase: string;
  kbSettings: {
    lastUpdated: string | null;
    autoUpdate: boolean;
  };
  status: string;
  createdAt: string;
}

const Domains: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    openAIKey: "",
    dbHost: "",
    dbPort: "",
    dbUser: "",
    dbPassword: "",
    dbDatabase: "",
    status: "active",
  });

  const fetchDomains = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const response = await apiService.getDomains({
        page,
        limit: 10,
        search,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setDomains(response.domains);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error("Error fetching domains:", error);
    } finally {
      setLoading(false);
    }
  };

  const maskOpenAIKey = (key: string) => {
  if (!key) return "";
  return key.slice(0, 4) + "*".repeat(Math.max(key.length - 8, 4)) + key.slice(-4);
};

  useEffect(() => {
    fetchDomains(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDomains(1, searchTerm);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDomain) {
        await apiService.updateDomain(editingDomain.id, formData);
      } else {
        await apiService.createDomain(formData);
      }
      setShowModal(false);
      setEditingDomain(null);
      setFormData({
        name: "",
        url: "",
        openAIKey: "",
        dbHost: "",
        dbPort: "",
        dbUser: "",
        dbPassword: "",
        dbDatabase: "",
        status: "active",
      });
      fetchDomains(currentPage, searchTerm);
    } catch (error) {
      console.error("Error saving domain:", error);
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      url: domain.url,
      status: domain.status,
    openAIKey: maskOpenAIKey(domain.openAIKey),
      dbHost: domain.dbHost || "",
      dbPort: domain.dbPort || "",
      dbUser: domain.dbUser || "",
      dbPassword: domain.dbPassword || "",
      dbDatabase: domain.dbDatabase || "",
    });
      setShowOpenAIKey(false); // start as hidden

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this domain?")) {
      try {
        await apiService.deleteDomain(id);
        fetchDomains(currentPage, searchTerm);
      } catch (error) {
        console.error("Error deleting domain:", error);
      }
    }
  };

  const handleKBUpdate = async (id: string) => {
    try {
      await apiService.updateDomainKB(id);
      fetchDomains(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating KB:", error);
    }
  };

  const openModal = () => {
    setEditingDomain(null);
    setFormData({
      name: "",
      url: "",
      openAIKey: "",
      dbHost: "",
      dbUser: "",
      dbPort: "",
      dbPassword: "",
      dbDatabase: "",
      status: "active",
    });
    setShowModal(true);
  };

  const showTokenDetails = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowTokenModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Domains Table */}
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domains.map((domain) => (
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
                              {domain.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {domain.url}
                            </div>
                            {/* <div className="text-xs text-gray-400">
                              ID: {domain.id}
                            </div> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            domain.status === "active"
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
                            {domain.kbSettings.lastUpdated
                              ? new Date(
                                  domain.kbSettings.lastUpdated
                                ).toLocaleDateString()
                              : "Never"}
                          </div>
                          <button
                            onClick={() => handleKBUpdate(domain.id)}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Update Now
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => showTokenDetails(domain)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View API Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* <button
                            onClick={() => showInvoices(domain)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Invoices"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button> */}
                          <button
                            onClick={() => handleEdit(domain)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Domain"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(domain.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Domain"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
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
      type={showOpenAIKey ? "text" : "password"}
    placeholder="Enter OpenAI Key"
    value={formData.openAIKey}
    onChange={(e) => setFormData({ ...formData, openAIKey: e.target.value })}
    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
  />
  {editingDomain && (
      <button
        type="button"
        onClick={async () => {
          if (!showOpenAIKey) {
            // fetch actual key from backend
            const res = await apiService.revealOpenAIKey(editingDomain.id);
            setFormData((prev) => ({ ...prev, openAIKey: res.openAIKey }));
          } else {
            // mask key again
            setFormData((prev) => ({
              ...prev,
              openAIKey: maskOpenAIKey(prev.openAIKey),
            }));
          }
          setShowOpenAIKey(!showOpenAIKey);
        }}
        className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-100"
      >
        {showOpenAIKey ? "Hide" : "Show"}
      </button>
    )}
</div>
             <div className="border-t pt-4 mt-4">
  <h4 className="text-sm font-medium text-gray-500 mb-3">
    Database Connection Info
  </h4>

  <div className="grid grid-cols-2 gap-4">
    {/* Database Host */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Database Host
      </label>
      <input
        type="text"
        value={formData.dbHost}
        onChange={(e) => setFormData({ ...formData, dbHost: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="localhost"
      />
    </div>

    {/* Database User */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Database User
      </label>
      <input
        type="text"
        value={formData.dbUser}
        onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="username"
      />
    </div>

    {/* Database Password */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Database Password
      </label>
      <input
        type="password"
        value={formData.dbPassword}
        onChange={(e) =>
          setFormData({ ...formData, dbPassword: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="••••••••"
      />
    </div>

    {/* Database Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Database Name
      </label>
      <input
        type="text"
        value={formData.dbDatabase}
        onChange={(e) =>
          setFormData({ ...formData, dbDatabase: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="database_name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Database Port
      </label>
      <input
        type="text"
        value={formData.dbPort}
        onChange={(e) =>
          setFormData({ ...formData, dbPort: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Port"
      />
    </div>
  </div>
</div>

{/* Status below DB Info */}
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Status
  </label>
  <select
    value={formData.status}
    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingDomain ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Details Modal */}
      {showTokenModal && selectedDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              API Details - {selectedDomain.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                    {selectedDomain.apiEndpoint}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedDomain.apiEndpoint)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Token
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                    {selectedDomain.authToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedDomain.authToken)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain ID
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                    {selectedDomain.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedDomain.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Domains;
