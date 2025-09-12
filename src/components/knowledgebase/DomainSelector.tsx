import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Domain } from '../../types/knowledgebase';

interface DomainSelectorProps {
  domains: Domain[];
  selectedDomain: string;
  onDomainChange: (domainId: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

const DomainSelector: React.FC<DomainSelectorProps> = ({
  domains,
  selectedDomain,
  onDomainChange,
  onRefresh,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Domain (Client's)
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select a domain/client's...</option>
            {domains.map((domain) => (
              <option key={domain.id || domain.name} value={domain.id}>
                {domain.name} ({domain.domain})
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            disabled={disabled || !selectedDomain}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainSelector;