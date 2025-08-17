import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Calendar,
  Search,
  Filter,
  Download,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Domain {
  _id: string;
  name: string;
  url: string;
  domainId: string;
}

interface TokenLog {
  _id: string;
  domainId: {
    _id: string;
    name: string;
    url: string;
    domainId: string;
  };
  date: string;
  tokensUsed: number;
  requestType: string;
  cost: number;
  metadata: {
    userQuery?: string;
    responseLength?: number;
    sessionId?: string;
    model?: string;
  };
}

interface TokenStats {
  total: {
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
  };
  dailyUsage: Array<{
    _id: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  usageByDomain: Array<{
    _id: string;
    tokens: number;
    cost: number;
    requests: number;
    domainName: string;
  }>;
}

const TokenUsage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [stats, setStats] = useState<TokenStats>({
    total: { totalTokens: 0, totalCost: 0, totalRequests: 0 },
    dailyUsage: [],
    usageByDomain: []
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filters
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [requestType, setRequestType] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDomains = async () => {
    try {
      const response = await apiService.getDomains({ limit: 100 });
      setDomains(response.domains);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const fetchTokenLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      
      if (selectedDomain) params.domainId = selectedDomain;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (requestType) params.requestType = requestType;

      const response = await apiService.getTokenUsage(params);
      setLogs(response.logs);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error('Error fetching token logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenStats = async () => {
    try {
      setStatsLoading(true);
      const params: any = { days: 30 };
      if (selectedDomain) params.domainId = selectedDomain;

      const response = await apiService.getTokenStats(params);
      setStats(response);
    } catch (error) {
      console.error('Error fetching token stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchTokenLogs();
    fetchTokenStats();
  }, [selectedDomain, startDate, endDate, requestType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTokenLogs(1);
    fetchTokenStats();
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      const params: any = {};
      if (selectedDomain) params.domainId = selectedDomain;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let blob;
      if (format === 'csv') {
        blob = await apiService.downloadCSVReport(params);
      } else {
        blob = await apiService.downloadPDFReport(params);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `token-usage-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${format.toUpperCase()} report:`, error);
    }
  };

  // Prepare chart data
  const lineChartData = {
    labels: stats.dailyUsage.map(item => format(new Date(item._id), 'MMM dd')),
    datasets: [
      {
        label: 'Tokens Used',
        data: stats.dailyUsage.map(item => item.tokens),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Requests',
        data: stats.dailyUsage.map(item => item.requests),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const barChartData = {
    labels: stats.usageByDomain.map(item => item.domainName || 'Unknown'),
    datasets: [
      {
        label: 'Tokens Used',
        data: stats.usageByDomain.map(item => item.tokens),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-100 text-blue-800';
      case 'kb_update':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-purple-100 text-purple-800';
      case 'crawl':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Token Usage Analytics</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => downloadReport('csv')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV Report
          </button>
          <button
            onClick={() => downloadReport('pdf')}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? (
          <div className="col-span-3 flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total.totalTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.total.totalCost.toFixed(2)}
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
                    {stats.total.totalRequests.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Usage Trend (30 Days)
          </h3>
          <div className="h-64">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Line data={lineChartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Usage by Domain
          </h3>
          <div className="h-64">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : stats.usageByDomain.length > 0 ? (
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No usage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain._id} value={domain._id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="chat">Chat</option>
              <option value="kb_update">KB Update</option>
              <option value="training">Training</option>
              <option value="crawl">Crawl</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4 inline mr-2" />
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Token Usage Table */}
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
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div>{format(new Date(log.date), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(log.date), 'HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.domainId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.domainId.domainId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRequestTypeColor(log.requestType)}`}
                        >
                          {log.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                          {log.tokensUsed.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                          {log.cost.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          {log.metadata.userQuery && (
                            <div className="mb-1">
                              <span className="font-medium">Query:</span>{' '}
                              {log.metadata.userQuery.substring(0, 50)}
                              {log.metadata.userQuery.length > 50 && '...'}
                            </div>
                          )}
                          {log.metadata.model && (
                            <div className="text-xs">
                              Model: {log.metadata.model}
                            </div>
                          )}
                          {log.metadata.sessionId && (
                            <div className="text-xs">
                              Session: {log.metadata.sessionId}
                            </div>
                          )}
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
              </div>
            )}

            {logs.length === 0 && !loading && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No token usage data found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TokenUsage;