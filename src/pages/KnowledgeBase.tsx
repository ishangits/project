import React, { useState, useEffect, useMemo } from "react";
import { FileText } from "lucide-react";

import { useKnowledgeBase } from "../hooks/useKnowledgeBase";
import DomainSelector from "../components/knowledgebase/DomainSelector";
import ViewToggle from "../components/knowledgebase/ViewToggle";
import KBSearch from "../components/knowledgebase/KBSearch";
import KBTable from "../components/knowledgebase/KBTable";
import DomainEntriesTable from "../components/knowledgebase/DomainEntriesTable";
import ActionButtons from "../components/knowledgebase/ActionButtons";
import AddEntryModal from "../components/knowledgebase/AddEntryModal";
import UploadModal from "../components/knowledgebase/UploadModal";

const KnowledgeBase: React.FC = () => {
  const itemsPerPage = 10;
  const {
    domains,
    selectedDomain,
    setSelectedDomain,
    kbEntries,
    domainEntries,
    loading,
    domainEntriesLoading,
    currentPage,
    domainCurrentPage,
    domainTotalPages,
    activeView,
    setActiveView,
    training,
    fetchDomains,
    fetchKbEntries,
    fetchDomainEntries,
    trainKb,
    trainDomain,
    setCurrentPage,
    setDomainCurrentPage,
  } = useKnowledgeBase(itemsPerPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    if (selectedDomain) {
      if (activeView === "kb") {
        fetchKbEntries(selectedDomain);
      } else {
        fetchDomainEntries(selectedDomain, domainCurrentPage);
      }
    }
  }, [selectedDomain, activeView, domainCurrentPage, fetchKbEntries, fetchDomainEntries]);

  const filteredKbEntries = useMemo(() => {
    if (!searchTerm && !typeFilter) {
      return kbEntries;
    }

    return kbEntries.filter((entry) => {
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
  }, [searchTerm, typeFilter, kbEntries]);

  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId);
    setCurrentPage(1);
    setDomainCurrentPage(1);
  };

  const handleRefresh = () => {
    if (selectedDomain) {
      if (activeView === "kb") {
        fetchKbEntries(selectedDomain);
      } else {
        fetchDomainEntries(selectedDomain, domainCurrentPage);
      }
    }
  };

  const handleViewChange = (view: "kb" | "domain") => {
    setActiveView(view);
    setCurrentPage(1);
    setDomainCurrentPage(1);
  };

  const handleKbPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDomainPageChange = (page: number) => {
    setDomainCurrentPage(page);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setTypeFilter("");
  };

  const handleEntryAdded = () => {
    if (selectedDomain) {
      fetchKbEntries(selectedDomain);
    }
  };

  const handleUploadSuccess = () => {
    if (selectedDomain) {
      fetchKbEntries(selectedDomain);
    }
  };

  const handleTrainDomain = (domainId: string, urlId: string) => {
    trainDomain(domainId, urlId);
  };

  const handleTrainAllPages = () => {
    if (selectedDomain) {
      trainDomain(selectedDomain, 'all');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Knowledge Base Management
        </h1>

        <ActionButtons
          activeView={activeView}
          selectedDomain={selectedDomain}
          onShowUploadModal={() => setShowUploadModal(true)}
          onShowAddModal={() => setShowAddModal(true)}
          onTrainKb={() => trainKb(selectedDomain)}
          onTrainAllPages={handleTrainAllPages}
        />
      </div>

      <DomainSelector
        domains={domains}
        selectedDomain={selectedDomain}
        onDomainChange={handleDomainChange}
        onRefresh={handleRefresh}
      />

      <ViewToggle
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {activeView === "kb" && (
        <KBSearch
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          onSearchChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onClear={handleSearchClear}
        />
      )}

      {selectedDomain ? (
        <>
          {activeView === "kb" ? (
            <KBTable
              entries={filteredKbEntries}
              loading={loading}
              currentPage={currentPage}
              totalPages={Math.ceil(filteredKbEntries.length / itemsPerPage)}
              itemsPerPage={itemsPerPage}
              searchTerm={searchTerm}
              typeFilter={typeFilter}
              onPageChange={handleKbPageChange}
            />
          ) : (
            <DomainEntriesTable
              entries={domainEntries}
              loading={domainEntriesLoading}
              currentPage={domainCurrentPage}
              totalPages={domainTotalPages}
              selectedDomain={selectedDomain}
              onPageChange={handleDomainPageChange}
              onTrainDomain={handleTrainDomain}
            />
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

      {training && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          <span className="ml-4 text-white font-medium">
            Training Started...
          </span>
        </div>
      )}

      <AddEntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDomain={selectedDomain}
        onEntryAdded={handleEntryAdded}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        selectedDomain={selectedDomain}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default KnowledgeBase;