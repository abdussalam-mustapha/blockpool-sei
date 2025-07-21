import React from 'react';
import { ChevronDown, Network, Zap } from 'lucide-react';
import { 
  type SupportedNetwork, 
  getSupportedNetworks, 
  getNetworkDisplayName, 
  isEVMMode, 
  isNativeMode,
  getEVMNetworks,
  getNativeNetworks 
} from '../lib/config';

interface NetworkSelectorProps {
  selectedNetwork: SupportedNetwork;
  onNetworkChange: (network: SupportedNetwork) => void;
  className?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const supportedNetworks = getSupportedNetworks();
  
  const nativeNetworks = getNativeNetworks();
  const evmNetworks = getEVMNetworks();

  const handleNetworkSelect = (network: SupportedNetwork) => {
    onNetworkChange(network);
    setIsOpen(false);
  };

  const getNetworkIcon = (network: SupportedNetwork) => {
    if (isNativeMode(network)) {
      return <Network className="w-4 h-4" />;
    }
    return <Zap className="w-4 h-4 text-green-400" />;
  };

  const getNetworkBadge = (network: SupportedNetwork) => {
    if (isNativeMode(network)) {
      return (
        <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
          Native
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
        SEI
      </span>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:border-green-500/50 transition-colors min-w-[200px]"
      >
        {getNetworkIcon(selectedNetwork)}
        <span className="text-white font-medium flex-1 text-left">
          {getNetworkDisplayName(selectedNetwork)}
        </span>
        {getNetworkBadge(selectedNetwork)}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {/* SEI Native Networks */}
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                SEI Native
              </div>
              {nativeNetworks.map((network) => (
                <button
                  key={network}
                  onClick={() => handleNetworkSelect(network)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center space-x-2 ${
                    selectedNetwork === network ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  <span>{getNetworkDisplayName(network)}</span>
                  <span className="ml-auto px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                    Native
                  </span>
                </button>
              ))}
            </div>

            {/* SEI EVM Networks */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                SEI EVM
              </div>
              {evmNetworks.map((network) => (
                <button
                  key={network}
                  onClick={() => handleNetworkSelect(network)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center space-x-2 ${
                    selectedNetwork === network ? 'bg-green-500/20 text-green-400' : 'text-gray-300'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{getNetworkDisplayName(network)}</span>
                  <span className="ml-auto px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                    EVM
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;
