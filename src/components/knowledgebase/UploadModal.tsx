import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';
import { Info } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDomain: string;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  selectedDomain,
  onUploadSuccess
}) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !uploadFile) return;

    try {
      setUploadProgress(true);
      const result = await apiService.uploadKBFile(selectedDomain, uploadFile);
      toast.success(result.message);
      onClose();
      setUploadFile(null);
      (e.target as HTMLFormElement).reset();
      onUploadSuccess();
    } catch (error: any) {
      console.error("Error uploading KB file:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadProgress(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Upload KB File
        </h3>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select File (CSV or Excel)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Info color="#e60f0f" className="h-3 w-3 mr-1" />
              File should have 'question' and 'answer' columns.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!uploadFile || uploadProgress}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {uploadProgress ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;