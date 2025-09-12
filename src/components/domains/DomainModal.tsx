import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../../services/api';
import { Domain, FormData } from '../../types/domain';

interface DomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDomain: Domain | null;
  onSubmit: () => void;
}

const DomainModal: React.FC<DomainModalProps> = ({
  isOpen,
  onClose,
  editingDomain,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    domain: "",
    openai_api_key: "",
    status: "Active",
  });
  const [apiKeyTouched, setApiKeyTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDomain) {
      const isEncrypted = editingDomain.openai_api_key.includes(":") && !isValidApiKey(editingDomain.openai_api_key);
      const apiKeyValue = isEncrypted ? "" : editingDomain.openai_api_key;
      
      setFormData({
        id: editingDomain.id,
        name: editingDomain.name,
        domain: editingDomain.domain,
        status: editingDomain.status,
        openai_api_key: apiKeyValue,
      });
      setApiKeyTouched(false);
    } else {
      setFormData({
        id: "",
        name: "",
        domain: "",
        openai_api_key: "",
        status: "Active",
      });
    }
  }, [editingDomain, isOpen]);

  const isValidApiKey = (key: string): boolean => {
    const apiKeyRegex = /^sk-[a-zA-Z0-9_-]{20,}$/;
    return apiKeyRegex.test(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate API key if it's touched or for a new domain
    if ((!editingDomain || apiKeyTouched) && formData.openai_api_key && !isValidApiKey(formData.openai_api_key)) {
      toast.error("Please enter a valid OpenAI API key format (typically starts with sk-...)");
      setLoading(false);
      return;
    }

    try {
      const fieldMap: Record<string, string> = {
        name: "name",
        domain: "domain",
        status: "status",
        openai_api_key: "apiKey",
      };

      const payload: any = {};

      // Map all form fields
      Object.keys(fieldMap).forEach((key) => {
        const value = formData[key as keyof typeof formData];

        if (key === "openai_api_key") {
          if (value && isValidApiKey(value)) {
            payload[fieldMap[key]] = value;
          }
          return;
        }

        if (value !== undefined) {
          payload[fieldMap[key]] = value;
        }
      });

      // Ensure status defaults to "Active" for new domains
      if (!editingDomain) {
        payload.status = payload.status || "Active";
        await apiService.createDomain(payload);
        toast.success("Domain created successfully!");
      } else {
        const { id } = formData;
        const payloadToUpdate = { ...payload, id };

        const { domain, name, status, ...rest } = payloadToUpdate;
        await apiService.updateDomain(rest);
        toast.success("Domain updated successfully!");
      }

      onSubmit();
      onClose();
    } catch (error: any) {
      console.error("Error saving domain:", error);
      toast.error(error?.response?.data?.message || "Failed to save domain");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[650px] shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editingDomain ? "Edit Domain" : "Add New Domain"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              readOnly={!!editingDomain}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name:
                    e.target.value.charAt(0).toUpperCase() +
                    e.target.value.slice(1),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="domain"
              required
              value={formData.domain}
              readOnly={!!editingDomain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI Key
            </label>
            <input
              type="text"
              placeholder={
                editingDomain && !apiKeyTouched
                  ? "******************************************"
                  : "Enter OpenAI Key (starts with sk-...)"
              }
              value={formData.openai_api_key}
              onChange={(e) => {
                setFormData({ ...formData, openai_api_key: e.target.value });
                setApiKeyTouched(true);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            {editingDomain && !apiKeyTouched && (
              <p className="text-xs text-gray-500 mt-1">
                API key is encrypted. Leave as it is to keep current key or enter a new one.
              </p>
            )}
            {apiKeyTouched && formData.openai_api_key && !isValidApiKey(formData.openai_api_key) && (
              <p className="text-xs text-red-500 mt-1">
                This doesn't look like a valid OpenAI API key format.
              </p>
            )}
          </div>
          {/* Status below DB Info */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              disabled={!!editingDomain}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
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
              disabled={loading || (!!editingDomain && (!apiKeyTouched || !formData.openai_api_key))}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : editingDomain ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainModal;