import React from 'react';
import { Upload, Plus, Blocks, Brain } from 'lucide-react';

interface ActionButtonsProps {
  activeView: 'kb' | 'domain';
  selectedDomain: string;
  onShowUploadModal: () => void;
  onShowAddModal: () => void;
  onTrainKb: () => void;
  onTrainAllPages: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  activeView,
  selectedDomain,
  onShowUploadModal,
  onShowAddModal,
  onTrainKb,
  onTrainAllPages
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex space-x-3">
        {activeView === 'kb' && (
          <>
            <button
              onClick={onShowUploadModal}
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </button>

            <button
              onClick={onShowAddModal}
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </button>

            <button
              onClick={onTrainKb}
              disabled={!selectedDomain}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Blocks className="h-4 w-4 mr-2" />
              Train KB
            </button>
          </>
        )}

        {activeView === 'domain' && (
          <button
            onClick={onTrainAllPages}
            disabled={!selectedDomain}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Brain className="h-4 w-4 mr-2" />
            Train All Pages
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;