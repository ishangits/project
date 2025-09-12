import React, { useState } from "react";
import { apiService } from "../services/api";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import ChatbotWidget from "./ChatbotWidget";
import { Domain, ChatState, EmbedConfig } from "../types/domain";
import DomainTable from "../components/domains/DomainTable";
import DomainModal from "../components/domains/DomainModal";
import EmbedModal from "../components/domains/EmbedModal";
import DeleteConfirmationModal from "../components/domains/DeleteConfirmationModal";
import { useDomains } from "../hooks/useDomains";

const Domains: React.FC = () => {
  const itemsPerPage = 10;
  const {
    domains,
    allDomains,
    filteredDomains,
    loading,
    currentPage,
    totalPages,
    fetchDomains,
    searchDomains,
    setCurrentPage,
    setFilteredDomains
  } = useDomains(itemsPerPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [training, setTraining] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    tenantId: null,
    sessionId: null,
  });

  // Embedded snippet
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedDomainForEmbed, setSelectedDomainForEmbed] = useState<Domain | null>(null);
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig>({
    themeColor: "#667eea",
    position: "bottom-right",
    greetingMessage: "Hello! How can I help you today?",
    showBranding: true,
    brandingText: "YourCompany",
  });

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

  const confirmDelete = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTenantId) return;

    try {
      const token = localStorage.getItem("token") || "";
      await apiService.deleteTenant(selectedTenantId, token);

      toast.success("Tenant deleted successfully!");
      fetchDomains();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tenant");
      console.error("Delete error:", error);
    } finally {
      setShowDeleteModal(false);
      setSelectedTenantId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedTenantId(null);
  };

  const handleFetchDomain = async (domainId: string) => {
    setTraining(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      await apiService.fetchDomain({ tenantId: domainId }, token);
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

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setShowModal(true);
  };

  const openModal = () => {
    setEditingDomain(null);
    setShowModal(true);
  };

  const handleEmbedClick = (domain: Domain) => {
    setSelectedDomainForEmbed(domain);
    setShowEmbedModal(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchDomains(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setFilteredDomains(allDomains);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4">
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

      <DomainTable
        domains={domains}
        filteredDomains={filteredDomains}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onChat={handleChatClick}
        onEmbed={handleEmbedClick}
        onDelete={confirmDelete}
        onFetchDomain={handleFetchDomain}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
      />

      {training && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          <span className="ml-4 text-white font-medium">
            Crawling Domain...
          </span>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <DomainModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingDomain={editingDomain}
        onSubmit={fetchDomains}
      />

      {chatState.isOpen && chatState.tenantId && chatState.sessionId && (
        <ChatbotWidget
          tenantId={chatState.tenantId}
          sessionId={chatState.sessionId}
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