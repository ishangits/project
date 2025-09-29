import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Clipboard } from 'lucide-react';
import { Domain, EmbedConfig } from '../../types/domain';
import debounce from 'lodash.debounce';

interface EmbedModalProps {
  domain: Domain;
  config: EmbedConfig;
  onConfigChange: (config: EmbedConfig) => void;
  onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({
  domain,
  config,
  onConfigChange,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage);
  const [brandingText, setBrandingText] = useState(config.brandingText);

  const debouncedUpdate = useCallback(
    debounce((field: string, value: string) => {
      onConfigChange({
        ...config,
        [field]: value,
      });
    }, 1000),
    [config, onConfigChange]
  );

  useEffect(() => {
    setGreetingMessage(config.greetingMessage);
    setBrandingText(config.brandingText);
  }, [config.greetingMessage, config.brandingText]);

  const copyToClipboard = async (text: string) => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  const handleCopy = async () => {
    const embedCode = generateEmbedCode(domain);
    const success = await copyToClipboard(embedCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Embed code copied to clipboard!');
    } else {
      toast.error('Failed to copy embed code');
    }
  };

  const generateEmbedCode = (domain: Domain) => {
    return `
<!-- Start of Chatbot Widget -->
<div id="chatbot-widget-container"></div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  (function() {
    var chatbotConfig = {
      tenantId: "${domain.id}",
      themeColor: "${config.themeColor}",
      position: "${config.position}",
      greetingMessage: "${config.greetingMessage}",
      brandingText: "${config.brandingText || "YourCompany"}",
      apiBase: "${import.meta.env.VITE_TENANT_API_BASE}",

    };
    
    // Load chatbot script
    var script = document.createElement('script');

script.src = "${import.meta.env.VITE_TENANT_CHATBOT_API}/chatbot/chatbot-widget.js";
    script.onload = function() {
      window.initChatbotWidget(chatbotConfig);
    };
    document.head.appendChild(script);
  })();
</script>
<!-- End of Chatbot Widget -->
  `.trim();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Embed Chatbot - {domain.name}
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Configuration</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme Color
                </label>
                <input
                  type="color"
                  value={config.themeColor}
                  onChange={(e) =>
                    onConfigChange({ ...config, themeColor: e.target.value })
                  }
                  className="w-full h-10 p-1 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  value={config.position}
                  onChange={(e) =>
                    onConfigChange({ ...config, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Greeting Message
                </label>
                <input
                  type="text"
                  value={greetingMessage}
                  onChange={(e) => {
                    setGreetingMessage(e.target.value); // live typing
                    debouncedUpdate("greetingMessage", e.target.value); // preview update
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBranding"
                  checked={config.showBranding}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      showBranding: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="showBranding"
                  className="ml-2 text-sm text-gray-700"
                >
                  Show Branding
                </label>
              </div>

              {config.showBranding && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branding Text
                  </label>
                  <input
                    type="text"
                    value={brandingText}
                    onChange={(e) => {
                      setBrandingText(e.target.value); // live typing
                      debouncedUpdate("brandingText", e.target.value); // preview update
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="YourCompany (default)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Live Preview</h4>
            <div className="border rounded-md p-4 h-64 bg-gray-50 relative overflow-hidden">
              <div className="relative h-full">
                {/* Preview Chat Toggle Button */}
                <div
                  className="absolute"
                  style={{
                    [config.position.includes("right") ? "right" : "left"]:
                      "10px",
                    [config.position.includes("bottom") ? "bottom" : "top"]:
                      "10px",
                    width: "40px",
                    height: "40px",
                    background: config.themeColor,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 10,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                      fill="white"
                    />
                  </svg>
                </div>

                <div
                  className="absolute"
                  style={{
                    [config.position.includes("right") ? "right" : "left"]:
                      "10px",
                    [config.position.includes("bottom") ? "bottom" : "top"]:
                      "60px",
                    width: "280px",
                    height: "220px",
                    background: "white",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 9,
                    border: "1px solid #e1e8ed",
                  }}
                >
                  <div
                    className="p-3 flex justify-between items-center"
                    style={{ background: config.themeColor, color: "white" }}
                  >
                    <span className="text-sm font-medium">Chat Support</span>
                    <button className="text-white opacity-80 text-lg">
                      ×
                    </button>
                  </div>

                  <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
                    <div className="space-y-2">
                      {/* Bot message preview */}
                      <div className="flex flex-col items-start max-w-[80%]">
                        <div
                          className="px-3 py-2 rounded-2xl text-sm"
                          style={{
                            background: "#e9ecef",
                            borderBottomLeftRadius: "4px",
                          }}
                        >
                          {config.greetingMessage}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-white flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-full outline-none"
                      disabled
                    />
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: config.themeColor }}
                      disabled
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>

                  {config.showBranding && (
                    <div className="px-2 py-1 text-center text-xs text-gray-500 border-t bg-gray-50">
                      Powered by <strong>{config.brandingText || "YourCompany"}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <p>Position: {config.position}</p>
              <p>
                Color: <span className="font-mono">{config.themeColor}</span>
              </p>
              {config.showBranding && (
                <p>Branding: {config.brandingText || "YourCompany"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-700">Embed Code</h4>
            <button
              onClick={handleCopy}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {copied ? "Copied!" : "Copy Code"}
              <Clipboard className="h-4 w-4 ml-1" />
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
            {generateEmbedCode(domain)}
          </pre>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;