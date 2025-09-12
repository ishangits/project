import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDomain: string;
  onEntryAdded: () => void;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  onClose,
  selectedDomain,
  onEntryAdded
}) => {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    try {
      setLoading(true);
      await apiService.createKBEntry(selectedDomain, formData);
      onClose();
      setFormData({ question: "", answer: "" });
      onEntryAdded();
      toast.success("Entry added successfully!");
    } catch (error) {
      console.error("Error creating KB entry:", error);
      toast.error("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Add Knowledge Base Entry
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the question"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <textarea
              required
              rows={4}
              value={formData.answer}
              onChange={(e) =>
                setFormData({ ...formData, answer: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the answer"
            />
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal;