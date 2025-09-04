import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Calendar,
  ExternalLink,
  RefreshCw,
  Book
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const safeFormatDate = (date: string | null | undefined, formatStr: string) => {
  if (!date) return 'N/A';
  try {
    const parsed = parseISO(date);
    if (isNaN(parsed.getTime())) return 'N/A';
    return format(parsed, formatStr);
  } catch {
    return 'N/A';
  }
};

interface DashboardStats {
  totalDomains: number;
  totalTokens: number;
  totalKbEntries: number;
  totalRequests: number;
  dateWiseTokens: Array<{date: string, tokens: number;  }>;
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

const Dashboard: React.FC = () => {
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


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const lineChartData = {
    labels: stats.dateWiseTokens.map(item => safeFormatDate(item.date, 'MMM dd')),
    datasets: [
      {
        data: stats.dateWiseTokens.map(item => item.tokens),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: stats.usageByDomain.map(item => item?.domain || 'Unknown'),
    datasets: [
      {
        data: stats.usageByDomain.map(item => item.tokens),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const , display: false
} },
    scales: { y: { beginAtZero: true } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Domains</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDomains}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">
  {Number(stats.totalTokens || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Book className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total KB Entries</p>
              <p className="text-2xl font-bold text-gray-900">
  {Number(stats.totalKbEntries || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
  {Number(stats.totalRequests || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Token Usage Trend (30 Days)
          </h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Usage by Domain
          </h3>
          <div className="h-64 flex items-center justify-center">
            {stats.usageByDomain.length > 0 ? (
              <Doughnut data={doughnutData} />
            ) : (
              <p className="text-gray-500">No usage data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
