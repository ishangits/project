/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, Download, DollarSign, Activity, TrendingUp } from 'lucide-react';
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
import { format, subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// ---------------- Types ----------------
interface Domain {
  id: string;
  _id?: string;
  name: string;
  url?: string;
  domainId?: string;
}

interface TokenLog {
  id: string;
  domain: { _id?: string; name: string; url?: string; domainId?: string };
  date: string;
  tokensUsed: number;
  requestType: string;
  cost: number;
}

interface TokenStats {
  total: { totalTokens: number; totalCost: number; totalRequests: number };
  dailyUsage: Array<{ _id?: string; tokens: number; day: string; cost: number; requests: number }>;
  usageByDomain: Array<{ _id?: string; tokens: number; cost: number; requests: number; domain: { name: string } }>;
}

// ---------------- Component ----------------
const TokenUsage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [stats, setStats] = useState<TokenStats>({
    total: { totalTokens: 0, totalCost: 0, totalRequests: 0 },
    dailyUsage: [],
    usageByDomain: [],
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [requestType, setRequestType] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ---------------- Helpers ----------------
  const safeFormatDate = (dateStr: string, fmt = 'MMM dd') => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Invalid Date' : format(date, fmt);
  };

  const safeCost = (cost: any) => {
    const n = Number(cost ?? 0);
    return isNaN(n) ? '0.0000' : n.toFixed(4);
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

  // ---------------- Mock API Calls ----------------
  const fetchTokenLogs = async (page = 1) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500)); // simulate delay

    const mockLogs: TokenLog[] = Array.from({ length: 10 }, (_, i) => ({
      id: `log_${page}_${i + 1}`,
      domain: { name: `Domain ${i + 1}` },
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      tokensUsed: Math.floor(Math.random() * 500) + 50,
      requestType: ['chat', 'kb_update', 'training', 'crawl'][i % 4],
      cost: parseFloat((Math.random() * 5).toFixed(4)),
    }));

    setLogs(mockLogs);
    setTotalPages(5);
    setCurrentPage(page);
    setLoading(false);
  };

  const fetchTokenStats = async () => {
    setStatsLoading(true);
    await new Promise(r => setTimeout(r, 500)); // simulate delay

    const dailyUsage = Array.from({ length: 30 }, (_, i) => ({
      day: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      tokens: Math.floor(Math.random() * 500) + 100,
      requests: Math.floor(Math.random() * 50) + 5,
      cost: parseFloat((Math.random() * 10).toFixed(4)),
    }));

    const usageByDomain = Array.from({ length: 5 }, (_, i) => ({
      domain: { name: `Domain ${i + 1}` },
      tokens: Math.floor(Math.random() * 1000) + 200,
      requests: Math.floor(Math.random() * 100) + 10,
      cost: parseFloat((Math.random() * 20).toFixed(4)),
    }));

    const totalTokens = dailyUsage.reduce((acc, d) => acc + d.tokens, 0);
    const totalRequests = dailyUsage.reduce((acc, d) => acc + d.requests, 0);
    const totalCost = dailyUsage.reduce((acc, d) => acc + d.cost, 0);

    setStats({ total: { totalTokens, totalCost, totalRequests }, dailyUsage, usageByDomain });
    setStatsLoading(false);
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    alert(`Downloading mock ${format.toUpperCase()} report...`);
  };

  // ---------------- Effects ----------------
  useEffect(() => {
    apiService.getDomains({ limit: 100 }).then(res => setDomains(res.tenants || []));
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

  // ---------------- Charts ----------------
  const lineChartData = {
    labels: stats.dailyUsage.map(item => safeFormatDate(item.day)),
    datasets: [
      { label: 'Tokens Used', data: stats.dailyUsage.map(d => d.tokens), borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4 },
      { label: 'Requests', data: stats.dailyUsage.map(d => d.requests), borderColor: 'rgb(16,185,129)', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, yAxisID: 'y1' },
    ],
  };

  const barChartData = {
    labels: stats.usageByDomain.map(d => d.domain.name),
    datasets: [{ label: 'Tokens Used', data: stats.usageByDomain.map(d => d.tokens), backgroundColor: 'rgba(59,130,246,0.6)', borderColor: 'rgb(59,130,246)', borderWidth: 1 }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' as const } }, scales: { y: { type: 'linear' as const, display: true, position: 'left' as const, beginAtZero: true }, y1: { type: 'linear' as const, display: true, position: 'right' as const, beginAtZero: true, grid: { drawOnChartArea: false } } } };

  // ---------------- Render ----------------
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
                    {Number(stats.total.totalTokens).toLocaleString()}
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
                    ${safeCost(stats.total.totalCost)}
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
                    {Number(stats.total.totalRequests).toLocaleString()}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {domains.map(domain => {
  return (
    <option key={domain.id} value={domain.id}>
      {domain.name}
    </option>
  );
})}

            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
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
          <div className="p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-gray-500">No token logs found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Domain</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tokens</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Request Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td className="px-4 py-2 text-sm text-gray-700">{safeFormatDate(log.date, 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.domain?.name || 'Unknown'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.tokensUsed}</td>
                  <td className={`px-4 py-2 text-sm font-medium rounded-full w-max ${getRequestTypeColor(log.requestType)}`}>
                    {log.requestType || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">${safeCost(log.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-200">
            <button
              disabled={currentPage === 1}
              onClick={() => fetchTokenLogs(currentPage - 1)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => fetchTokenLogs(currentPage + 1)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenUsage;
