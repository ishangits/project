import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { Domain, KBEntry, DomainEntry, DomainEntriesResponse, ViewType } from '../types/knowledgebase';

export const useKnowledgeBase = (itemsPerPage: number = 10) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [domainEntries, setDomainEntries] = useState<DomainEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainEntriesLoading, setDomainEntriesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [domainCurrentPage, setDomainCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [domainTotalPages, setDomainTotalPages] = useState(1);
  const [activeView, setActiveView] = useState<ViewType>("kb");
  const [training, setTraining] = useState(false);

  const fetchDomains = useCallback(async () => {
    try {
      const response = await apiService.getDomains({ limit: 100 });
      setDomains(response.tenants);
      if (response.tenants.length > 0 && !selectedDomain) {
        setSelectedDomain(response.tenants[0].id);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to fetch domains");
    }
  }, [selectedDomain]);

  const fetchKbEntries = useCallback(async (domainId: string) => {
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

      setKbEntries(entries);
      setTotalPages(Math.ceil(entries.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching KB entries:", error);
      toast.error("Failed to fetch knowledge base entries");
      setKbEntries([]);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  const fetchDomainEntries = useCallback(async (domainId: string, page: number = 1) => {
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
  }, []);

  const trainKb = useCallback(async (tenantId: string) => {
    setTraining(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      await apiService.trainKB({ tenantId }, token);
      toast.success("KB Training Started");
    } catch (error: any) {
      toast.error(
        error.message ||
        error.response?.data?.message ||
        "Training failed"
      );
    } finally {
      setTraining(false);
    }
  }, []);

  const trainDomain = useCallback(async (tenantId: string, urlId: string = 'all') => {
    setTraining(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in");
      await apiService.trainDomain({ tenantId, urlId }, token);
      toast.success(urlId === 'all' ? "Training All Pages Started" : "Training Success");
    } catch (error: any) {
      toast.error(
        error.message ||
        error.response?.data?.message ||
        "Training failed"
      );
    } finally {
      setTraining(false);
    }
  }, []);

  return {
    domains,
    selectedDomain,
    setSelectedDomain,
    kbEntries,
    domainEntries,
    loading,
    domainEntriesLoading,
    currentPage,
    domainCurrentPage,
    totalPages,
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
  };
};