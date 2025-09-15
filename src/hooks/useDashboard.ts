// hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface DashboardStats {
  totalDomains: number;
  totalTokens: number;
  totalKbEntries: number;
  totalRequests: number;
  dateWiseTokens: Array<{date: string, tokens: number;}>;
  usageByDomain: Array<{ tokens: number; cost: number; requests: number; domain: {name: string} }>;
}

interface Domain {
  id: string;
  name: string;
  url: string;
  kbSettings: {
    lastUpdated: string | null;
    autoUpdate: boolean;
  };
  status: string;
  createdAt: string;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDomains: 0,
    totalTokens: 0,
    totalKbEntries: 0,
    totalRequests: 0,
    dateWiseTokens: [],
    usageByDomain: []
  });
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const data = await apiService.getDashboardData();

      const mappedStats: DashboardStats = {
        totalDomains: data?.totalTenants || 0, 
        totalTokens: Number(data?.totalTokens) || 0,
        totalKbEntries: data?.totalKBEntries,
        totalRequests: Number(data?.totalChatMessageResult) || 0,
        dateWiseTokens: (data?.dateWiseTokens || []).map((item: any) => ({
          tokens: Number(item?.tokens) || 0,
          cost: 0, 
          requests: 0, 
          date: item?.date
        })),
        usageByDomain: data?.domainWiseTokens || []
      };

      setStats(mappedStats);

      const domainsData = await apiService.getDomains({ limit: 5 });
      setDomains(domainsData.tenants || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    domains,
    loading,
    refreshing,
    handleRefresh,
    fetchDashboardData
  };
};