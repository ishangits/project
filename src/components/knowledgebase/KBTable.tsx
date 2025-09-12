import React from 'react';
import { Search } from 'lucide-react';
import { KBEntry } from '../../types/knowledgebase';

interface KBTableProps {
  entries: KBEntry[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  searchTerm: string;
  typeFilter: string;
  onPageChange: (page: number) => void;
}

const KBTable: React.FC<KBTableProps> = ({
  entries,
  loading,
  currentPage,
  totalPages,
  itemsPerPage,
  searchTerm,
  typeFilter,
  onPageChange
}) => {
  const getPaginatedEntries = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return entries.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getPaginatedEntries().length > 0 ? (
              getPaginatedEntries().map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.answer || "N/A"}>
                    <div className="font-medium">{entry.question}</div>
                    <div className="text-gray-500">{entry.answer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-1">
                      No entries found
                    </h3>
                    <p className="text-sm">
                      {(searchTerm || typeFilter)
                        ? `No results found for your search criteria`
                        : "No entries available"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                entries.length
              )}{" "}
              of {entries.length} results
              {(searchTerm || typeFilter) && <span> (filtered)</span>}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                First Page
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Last Page
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-2 space-x-2 text-sm text-gray-700">
            <span>
              Page <span className="font-medium">{currentPage}</span> of {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KBTable;