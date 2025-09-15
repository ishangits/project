// Dashboard.tsx - Refactored
import React from 'react';
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
import { useDashboard } from '../hooks/useDashboard';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import ChartsSection from '../components/dashboard/ChartsSection';

// Register Chart.js components
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

const Dashboard: React.FC = () => {
  const {
    stats,
    domains,
    loading,
    refreshing,
    handleRefresh
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <StatsCards 
        totalDomains={stats.totalDomains}
        totalTokens={stats.totalTokens}
        totalKbEntries={stats.totalKbEntries}
        totalRequests={stats.totalRequests}
      />

      <ChartsSection 
        dateWiseTokens={stats.dateWiseTokens}
        usageByDomain={stats.usageByDomain}
      />
    </div>
  );
};

export default Dashboard;