import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { Domain } from '../types/domain';

export const useDomains = (itemsPerPage: number = 10) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [allDomains, setAllDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDomains = useCallback(async (page = 1) => {
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
  }, [itemsPerPage]);

  useEffect(() => {
    fetchDomains(currentPage);
  }, [currentPage, fetchDomains]);

  const searchDomains = useCallback((searchTerm: string) => {
    if (!searchTerm) {
      setFilteredDomains(allDomains);
      setCurrentPage(1);
      setTotalPages(Math.ceil(allDomains.length / itemsPerPage));
    } else {
      const value = searchTerm.toLowerCase();
      const filtered = allDomains.filter(
        (d) =>
          d.name.toLowerCase().includes(value) ||
          d.domain.toLowerCase().includes(value)
      );
      setFilteredDomains(filtered);
      setCurrentPage(1);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }
  }, [allDomains, itemsPerPage]);

  const getPaginatedDomains = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDomains.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, filteredDomains]);

  return {
    domains,
    allDomains,
    filteredDomains,
    loading,
    currentPage,
    totalPages,
    fetchDomains,
    searchDomains,
    getPaginatedDomains,
    setCurrentPage,
    setFilteredDomains
  };
};