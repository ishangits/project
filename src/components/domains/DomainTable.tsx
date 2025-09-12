import React from 'react';
import { Search } from 'lucide-react';
import { Domain } from '../../types/domain';
import LoadingSpinner from '../common/LoadingSpinner';
import DomainRow from './DomainRow';
import Pagination from './Pagination';

interface DomainTableProps {
  domains: Domain[];
  filteredDomains: Domain[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  searchTerm: string;
  onEdit: (domain: Domain) => void;
  onChat: (tenantId: string) => void;
  onEmbed: (domain: Domain) => void;
  onDelete: (tenantId: string) => void;
  onFetchDomain: (domainId: string) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

const DomainTable: React.FC<DomainTableProps> = ({
  domains,
  filteredDomains,
  loading,
  currentPage,
  totalPages,
  itemsPerPage,
  searchTerm,
  onEdit,
  onChat,
  onEmbed,
  onDelete,
  onFetchDomain,
  onPageChange,
  onSearchChange,
  onClearSearch
}) => {
  const getPaginatedDomains = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDomains.slice(startIndex, endIndex);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size={12} />
        </div>
      ) : (
        <>
          <div className="p-6 border-b border-gray-200">
            <form className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KB Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crawl Domain
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pages Crawled
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crawling Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedDomains().length > 0 ? (
                  getPaginatedDomains().map((domain) => (
                    <DomainRow
                      key={domain.id}
                      domain={domain}
                      onEdit={onEdit}
                      onChat={onChat}
                      onEmbed={onEmbed}
                      onDelete={onDelete}
                      onFetchDomain={onFetchDomain}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Search className="h-12 w-12 mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-1">
                          No domains found
                        </h3>
                        <p className="text-sm">
                          {searchTerm
                            ? `No results found for "${searchTerm}"`
                            : "No domains available"}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={onClearSearch}
                            className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredDomains.length}
              searchTerm={searchTerm}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DomainTable;