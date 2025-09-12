import React from 'react';
import { Search, Filter } from 'lucide-react';

interface KBSearchProps {
  searchTerm: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onClear: () => void;
}

const KBSearch: React.FC<KBSearchProps> = ({
  searchTerm,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onClear
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="manual">Manual</option>
            <option value="upload">Upload</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        {(searchTerm || typeFilter) && (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
};

export default KBSearch;