import { useState } from 'react';
import { Search, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

const Header = () => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [showAddressTooltip, setShowAddressTooltip] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleWalletAction = async () => {
    if (wallet.isConnected) {
      disconnectWallet();
    } else {
      try {
        await connectWallet();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setShowAddressTooltip(true);
      setTimeout(() => setShowAddressTooltip(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-black/95 backdrop-blur-lg border-b border-green-500/40 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img 
            src="/blockpool-logo.svg" 
            alt="Blockpool" 
            className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0"
          />
          <span className="text-lg md:text-xl font-bold text-white truncate">
            <span className="hidden sm:inline">Blockpool</span>
            <span className="sm:hidden">Blockpool</span>
          </span>
        </div>
        
        {/* Navigation Links - Desktop */}
        <nav className="hidden lg:flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium">
            Home
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium">
            Docs
          </a>
          <a 
            href="https://seitrace.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium flex items-center space-x-1"
          >
            <span>Chain Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>
        
        {/* Right side content */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search - Desktop only */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search addresses, tokens..."
              className="bg-black border border-green-500/40 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>

          {/* Wallet Section */}
          {wallet.isConnected ? (
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="bg-black border border-green-500/30 rounded-lg px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300 truncate max-w-[80px] md:max-w-none">
                    {formatAddress(wallet.address!)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="hover:text-green-400 transition-colors relative flex-shrink-0"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3" />
                    {showAddressTooltip && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                        Copied!
                      </div>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1 hidden md:block">
                  Balance: {wallet.balance}
                </div>
              </div>
              <Button
                onClick={handleWalletAction}
                variant="outline"
                size="sm"
                className="border-green-500/40 hover:border-green-500/60 bg-black text-xs md:text-sm px-2 md:px-3"
              >
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">×</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleWalletAction}
              disabled={isConnecting}
              size="sm"
              className="bg-green-500 hover:bg-green-600 font-medium text-xs md:text-sm px-3 md:px-4"
            >
              <span className="hidden sm:inline">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </span>
              <span className="sm:hidden">
                {isConnecting ? '...' : 'Connect'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
