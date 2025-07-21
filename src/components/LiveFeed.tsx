import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { seiMcpClient, type BlockchainEvent } from '@/services/seiMcpClient';

const LiveFeed = () => {
  const [feedItems, setFeedItems] = useState<BlockchainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple constants - no chunking, no pagination
  const MAX_ITEMS = 10; // Only show 10 most recent items

  // Simple function to load initial data once
  const loadInitialData = async () => {
    if (isLoading) return;
    
    console.log('🚀 LiveFeed: Loading initial 10 blockchain events...');
    setIsLoading(true);
    
    try {
      const events = await seiMcpClient.getRecentBlockchainEvents(MAX_ITEMS);
      
      if (events && events.length > 0) {
        setFeedItems(events);
        setConnectionStatus('connected');
        console.log(`✅ LiveFeed: Loaded ${events.length} blockchain events`);
      } else {
        console.log('⚠️ LiveFeed: No events available');
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('❌ LiveFeed: Error loading data:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Simple periodic refresh (every 2 minutes)
  useEffect(() => {
    if (!isPaused && connectionStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        console.log('🔄 LiveFeed: Refreshing data...');
        loadInitialData();
      }, 120000); // 2 minutes

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPaused, connectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    console.log(`⏯️ LiveFeed: ${isPaused ? 'Resumed' : 'Paused'}`);
  };

  const handleRefresh = () => {
    console.log('🔄 LiveFeed: Manual refresh triggered');
    loadInitialData();
  };

  const handleViewDetails = (transaction: BlockchainEvent) => {
    setSelectedTransaction(transaction);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'mint': return 'bg-green-600/10 text-green-300 border-green-600/30';
      case 'swap': return 'bg-green-400/10 text-green-500 border-green-400/30';
      case 'contract': return 'bg-green-700/10 text-green-200 border-green-700/30';
      default: return 'bg-green-500/10 text-green-400 border-green-500/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return 'Invalid time';
    }
  };

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      return num > 1000 ? `${(num / 1000).toFixed(1)}K` : num.toFixed(2);
    } catch {
      return amount;
    }
  };

  const truncateAddress = (address: string, startChars = 6, endChars = 4) => {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  return (
    <Card className="p-3 md:p-4 bg-black border border-green-500/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base md:text-lg font-semibold text-white truncate">
          <span className="hidden sm:inline">Live Blockchain Feed</span>
          <span className="sm:hidden">Live Feed</span>
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
          }`}></div>
          <span className="text-xs text-green-400 capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex space-x-2">
          <Button
            onClick={handlePauseToggle}
            variant="outline"
            size="sm"
            className="text-xs border-green-500/40 hover:border-green-500/60 bg-black text-green-400 hover:bg-green-500/10 px-2 md:px-3"
          >
            <span className="hidden sm:inline">{isPaused ? '▶️ Resume' : '⏸️ Pause'}</span>
            <span className="sm:hidden">{isPaused ? '▶️' : '⏸️'}</span>
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-xs border-green-500/40 hover:border-green-500/60 bg-black text-green-400 hover:bg-green-500/10 px-2 md:px-3"
            disabled={isLoading}
          >
            <span className="hidden sm:inline">{isLoading ? '⏳ Loading...' : '🔄 Refresh'}</span>
            <span className="sm:hidden">{isLoading ? '⏳' : '🔄'}</span>
          </Button>
        </div>
        <span className="text-xs text-green-400 text-center sm:text-right">
          <span className="hidden sm:inline">Showing {feedItems.length} recent transactions</span>
          <span className="sm:hidden">{feedItems.length} items</span>
        </span>
      </div>

      {connectionStatus === 'error' && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">⚠️</span>
            <p>MCP Server unavailable. No real blockchain data available.</p>
          </div>
        </div>
      )}

      <div className="space-y-3 overflow-y-auto max-h-96">
        {feedItems.length === 0 ? (
          <div className="text-center py-12 text-green-400/60">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto border-2 border-green-500/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-lg font-medium mb-2">
              {isLoading ? 'Loading blockchain events...' : 'No blockchain data available'}
            </p>
            <p className="text-sm text-green-400/40">
              {isLoading ? 'Fetching real SEI blockchain data...' : 'Connect to MCP server to view live transactions'}
            </p>
            {isLoading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
              </div>
            )}
          </div>
        ) : (
          <>
            {feedItems.map((item, index) => (
              <div 
                key={`${item.id}-${index}`}
                className="p-3 md:p-4 bg-black border border-green-500/20 rounded-lg hover:border-green-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
                style={{ transform: 'translateZ(0)', willChange: 'transform' }}
                onClick={() => setSelectedTransaction(item)}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border self-start ${getTypeColor(item.type)}`}>
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-green-400/60">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <span className={`text-sm font-medium self-start sm:self-auto ${
                    item.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.status === 'success' ? '✅' : '❌'}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-sm text-white mb-3 line-clamp-2 sm:truncate" title={item.description}>
                  {item.description}
                </p>
                
                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="text-green-400/60 truncate">
                    <span className="hidden sm:inline">From: </span>
                    <span className="sm:hidden">From: </span>
                    <span className="text-green-400 font-mono">{truncateAddress(item.from, 4, 4)}</span>
                  </div>
                  <div className="text-green-400/60 truncate">
                    <span className="hidden sm:inline">To: </span>
                    <span className="sm:hidden">To: </span>
                    <span className="text-green-400 font-mono">{truncateAddress(item.to, 4, 4)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4 text-green-400/60">
                    <span className="text-white font-medium">{formatAmount(item.amount)} {item.token}</span>
                    {item.fee && <span>Fee: {item.fee} SEI</span>}
                    <span>Block: {item.blockNumber}</span>
                  </div>
                  <button 
                    onClick={() => handleViewDetails(item)}
                    className="text-green-400 hover:text-green-300 transition-colors font-medium px-2 py-1 rounded border border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black border border-green-500/40 p-6 rounded-lg max-w-lg w-full mx-4 shadow-2xl shadow-green-500/20">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span className="text-green-400">📊</span>
                <span>Transaction Details</span>
              </h4>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-green-400/60 hover:text-green-400 transition-colors p-1 rounded hover:bg-green-500/10"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <span className="text-green-400/60 block mb-1">Type</span>
                  <span className="text-white font-medium">{selectedTransaction.type.toUpperCase()}</span>
                </div>
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <span className="text-green-400/60 block mb-1">Amount</span>
                  <span className="text-white font-medium">{selectedTransaction.amount} {selectedTransaction.token}</span>
                </div>
              </div>
              
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <span className="text-green-400/60 block mb-2">From Address</span>
                <span className="text-green-400 font-mono text-xs break-all bg-black/50 p-2 rounded border border-green-500/30">
                  {selectedTransaction.from}
                </span>
              </div>
              
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <span className="text-green-400/60 block mb-2">To Address</span>
                <span className="text-green-400 font-mono text-xs break-all bg-black/50 p-2 rounded border border-green-500/30">
                  {selectedTransaction.to}
                </span>
              </div>
              
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <span className="text-green-400/60 block mb-2">Transaction Hash</span>
                <span className="text-green-400 font-mono text-xs break-all bg-black/50 p-2 rounded border border-green-500/30">
                  {selectedTransaction.hash}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <span className="text-green-400/60 block mb-1">Block</span>
                  <span className="text-white font-medium">{selectedTransaction.blockNumber}</span>
                </div>
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <span className="text-green-400/60 block mb-1">Gas Used</span>
                  <span className="text-white font-medium">{selectedTransaction.gasUsed}</span>
                </div>
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <span className="text-green-400/60 block mb-1">Status</span>
                  <span className={`font-medium flex items-center space-x-1 ${
                    selectedTransaction.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>{selectedTransaction.status === 'success' ? '✅' : '❌'}</span>
                    <span>{selectedTransaction.status}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Warning for mock data - only show when MCP server is not connected */}
            {connectionStatus !== 'connected' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-400 text-xs">
                  <span>⚠️</span>
                  <span>Note: This is demo data with mock transaction hashes. Real blockchain data requires MCP server connection.</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              <Button
                onClick={() => {
                  const explorerUrl = `https://seitrace.com/tx/${selectedTransaction.hash}`;
                  window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                }}
                className="bg-green-500/10 border border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-500/60 flex items-center space-x-2"
                variant="outline"
                size="sm"
              >
                <span>🔍</span>
                <span>View on Explorer</span>
              </Button>
              <Button
                onClick={() => setSelectedTransaction(null)}
                className="bg-green-500/10 border border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-500/60"
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LiveFeed;
