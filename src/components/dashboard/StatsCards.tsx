// components/dashboard/StatsCards.tsx
import React from 'react';
import { Users, Activity, TrendingUp, Book } from 'lucide-react';

interface StatsCardsProps {
  totalDomains: number;
  totalTokens: number;
  totalKbEntries: number;
  totalRequests: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalDomains,
  totalTokens,
  totalKbEntries,
  totalRequests
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Domains</p>
            <p className="text-2xl font-bold text-gray-900">{totalDomains}</p>
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
              {Number(totalTokens || 0).toLocaleString()}
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
              {Number(totalKbEntries || 0)}
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
              {Number(totalRequests || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;