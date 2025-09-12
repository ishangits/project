import React from 'react';
import { Search } from 'lucide-react';
import { DomainEntry } from '../../types/knowledgebase';

interface DomainEntriesTableProps {
  entries: DomainEntry[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  selectedDomain: string;
  onPageChange: (page: number) => void;
  onTrainDomain: (domainId: string, urlId: string) => void;
}

const DomainEntriesTable: React.FC<DomainEntriesTableProps> = ({
  entries,
  loading,
  currentPage,
  totalPages,
  selectedDomain,
  onPageChange,
  onTrainDomain
}) => {
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
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TRAIN AT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title={entry.url}
                    >
                      {entry.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.title || "N/A"}>
                    {entry.title || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={entry.description || "N/A"}>
                    {entry.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.trainAt && new Date(entry.trainAt).getTime() > 0 ? (
                      <span className="text-gray-900">
                        {new Date(entry.trainAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not trained yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onTrainDomain(selectedDomain, entry.id.toString())}
                      className="px-6 py-4 text-green-600 hover:text-green-900"
                      title="Train Model"
                    >
                      Train
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-1">
                      No domain entries found
                    </h3>
                    <p className="text-sm">
                      No domain entries available for this domain
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
              Page {currentPage} of {totalPages}
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

export default DomainEntriesTable;