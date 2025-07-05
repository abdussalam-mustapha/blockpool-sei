import { useState } from 'react';
import { Search, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

const Header = () => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [showAddressTooltip, setShowAddressTooltip] = useState(false);

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
    <header className="sticky top-0 z-50 bg-black backdrop-blur-lg border-b border-green-500/40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/337ff584-1631-4788-98f0-5d71989f7c8c.png" 
              alt="Blockpool Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-white">Blockpool</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Home</a>
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Docs</a>
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Chain Explorer</a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search addresses, tokens..."
              className="bg-black border border-green-500/40 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {wallet.isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="bg-black border border-green-500/30 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">{formatAddress(wallet.address!)}</span>
                  <button
                    onClick={copyAddress}
                    className="hover:text-green-400 transition-colors relative"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3" />
                    {showAddressTooltip && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        Copied!
                      </div>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Balance: {wallet.balance}
                </div>
              </div>
              <Button
                onClick={handleWalletAction}
                variant="outline"
                className="border-green-500/40 hover:border-green-500/60 bg-black"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleWalletAction}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 font-medium glow-green"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
