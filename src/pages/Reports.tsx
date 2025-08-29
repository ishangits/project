/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Download,
  FileText,
  DollarSign,
} from 'lucide-react';

interface Domain {
  id: string;
  _id: string;
  name: string;
  url: string;
  domainId: string;
}

const Reports: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string>('');

  const fetchDomains = async () => {
    try {
      const response = await apiService.getDomains({ limit: 100 });
      setDomains(response.tenants);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      setGenerating(format);
      const params: any = {};
      if (selectedDomain) params.domainId = selectedDomain;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let blob;
      if (format === 'csv') {
        blob = await apiService.downloadCSVReport(params);
      } else {
        blob = await apiService.downloadPDFReport(params);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `token-usage-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${format.toUpperCase()} report:`, error);
      alert(`Error generating ${format.toUpperCase()} report. Please try again.`);
    } finally {
      setGenerating('');
    }
  };

  const generateInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = {
        domainId: selectedDomain,
        startDate,
        endDate,
        invoiceNumber: `INV-${Date.now()}`
      };

      const response = await apiService.generateInvoice(invoiceData);
      alert(`Invoice ${response.invoiceNumber} generated successfully!`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Billing</h1>
      </div>

      {/* Report Generation Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain (Optional)
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.id || domain.name} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => downloadReport('csv')}
            disabled={generating === 'csv'}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {generating === 'csv' ? 'Generating...' : 'Download CSV'}
          </button>

          <button
            onClick={() => downloadReport('pdf')}
            disabled={generating === 'pdf'}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {generating === 'pdf' ? 'Generating...' : 'Download PDF'}
          </button>

          <button
            onClick={generateInvoice}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">CSV Reports</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Download detailed token usage data in CSV format for analysis in spreadsheet applications.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Token usage by date</li>
            <li>• Domain-wise breakdown</li>
            <li>• Cost calculations</li>
            <li>• Request type analysis</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Download className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">PDF Reports</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Generate professional PDF reports with summaries and key metrics for presentations.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Executive summary</li>
            <li>• Usage statistics</li>
            <li>• Cost breakdown</li>
            <li>• Professional formatting</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Generate invoices for client billing based on token usage and configured rates.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Automated calculations</li>
            <li>• Professional format</li>
            <li>• Customizable rates</li>
            <li>• Billing periods</li>
          </ul>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">CSV Reports Include:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Date and time of each request</li>
              <li>• Name and ID</li>
              <li>• Tokens used per request</li>
              <li>• Request type (chat, training, etc.)</li>
              <li>• Calculated costs</li>
              <li>• Model information</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">PDF Reports Include:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Summary statistics</li>
              <li>• Total tokens and costs</li>
              <li>• Date range information</li>
              <li>• Top usage domains</li>
              <li>• Recent activity sample</li>
              <li>• Professional formatting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;