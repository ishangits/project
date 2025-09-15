// components/dashboard/DashboardHeader.tsx
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  refreshing
}) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
};

export default DashboardHeader;