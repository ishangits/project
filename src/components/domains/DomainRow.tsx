import React from 'react';
import { ExternalLink, Globe, Calendar, Edit3, MessageCircle, Code, Trash } from 'lucide-react';
import { Domain } from '../../types/domain';

interface DomainRowProps {
  domain: Domain;
  onEdit: (domain: Domain) => void;
  onChat: (tenantId: string) => void;
  onEmbed: (domain: Domain) => void;
  onDelete: (tenantId: string) => void;
  onFetchDomain: (domainId: string) => void;
}

const DomainRow: React.FC<DomainRowProps> = ({
  domain,
  onEdit,
  onChat,
  onEmbed,
  onDelete,
  onFetchDomain
}) => {
  return (
    <tr key={domain.id || domain.name} className="hover:bg-gray-50">
      <td className="px-8 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {domain.name.toUpperCase()}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a
                href={domain.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {domain.domain}
              </a>
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${domain.status === "Active"
            ? "bg-green-100 text-green-800"
            : domain.status === "inactive"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {domain.status}
        </span>
      </td>
      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            {domain?.knowledgeBaseUpdatedAt
              ? new Date(
                domain?.knowledgeBaseUpdatedAt
              ).toLocaleDateString()
              : "Never"}
          </div>
        </div>
      </td>
      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(domain.createdAt).toLocaleDateString()}
      </td>
      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          onClick={() => onFetchDomain(domain.id)}
          className="px-8 py-4 text-green-600 hover:text-green-900"
          title="Crawl Domain"
        >
          Fetch Web Pages
        </button>
      </td>
      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
        {domain.crawled_pages_count}
      </td>
      <td className="px-8 py-4 whitespace-nowrap text-sm">
        {domain.crawl_status ? (
          <span
            className={`font-semibold ${domain.crawl_status === "in-progress"
                ? "text-yellow-600"
                : domain.crawl_status === "completed"
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
          >
            {domain.crawl_status
              .replace(/-/g, " ") // replace hyphen with space
              .replace(/\b\w/g, (char) => char.toUpperCase())}
            {/* Capitalize first letter of each word */}
          </span>
        ) : (
          "N/A"
        )}
      </td>

      <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onEdit(domain)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit Domain"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onChat(domain.id)}
            className="text-blue-600 hover:text-blue-900"
            title="Open Chat"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEmbed(domain)}
            className="text-purple-600 hover:text-purple-900"
            title="Embed Chatbot"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(domain.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete Domain"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default DomainRow;