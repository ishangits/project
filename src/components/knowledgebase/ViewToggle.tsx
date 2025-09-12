import React from 'react';
import { BookOpen, Database } from 'lucide-react';
import { ViewType } from '../../types/knowledgebase';

interface ViewToggleProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex space-x-4">
        <button
          onClick={() => onViewChange("kb")}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${activeView === "kb"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          KB Entries
        </button>
        <button
          onClick={() => onViewChange("domain")}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${activeView === "domain"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
        >
          <Database className="h-4 w-4 mr-2" />
          Web Pages Entries
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;