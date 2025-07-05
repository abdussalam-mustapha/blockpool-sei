import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionDetailsModal from './TransactionDetailsModal';
import { seiMcpClient, type BlockchainEvent } from '@/services/seiMcpClient';

const LiveFeed = () => {
  const [feedItems, setFeedItems] = useState<BlockchainEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

  useEffect(() => {
    // Initialize MCP connection
    const initializeMcp = async () => {
      try {
        await seiMcpClient.connect();
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        setConnectionStatus('error');
      }
    };

    initializeMcp();

    // Listen for real-time blockchain events
    const handleBlockchainEvent = (event: BlockchainEvent) => {
      if (!isPaused) {
        setFeedItems(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 items
      }
    };

    // Listen for connection status changes
    const handleConnectionChange = (status: any) => {
      setConnectionStatus(status.status);
    };

    seiMcpClient.on('blockchainEvent', handleBlockchainEvent);
    seiMcpClient.on('connection', handleConnectionChange);

    // Cleanup
    return () => {
      seiMcpClient.off('blockchainEvent', handleBlockchainEvent);
      seiMcpClient.off('connection', handleConnectionChange);
    };
  }, [isPaused]);

  // Fallback simulation for demo purposes when MCP is not available
  useEffect(() => {
    if (connectionStatus === 'error' && !isPaused) {
      const interval = setInterval(() => {
        const simulatedEvent: BlockchainEvent = {
          id: Math.random().toString(),
          type: ['transfer', 'mint', 'swap', 'contract'][Math.floor(Math.random() * 4)] as any,
          description: [
            'Token transfer detected',
            'NFT minted on Palette',
            'DEX swap on DragonSwap',
            'Smart contract interaction',
            'Large whale movement',
            'New token pair created'
          ][Math.floor(Math.random() * 6)],
          amount: Math.random() > 0.5 ? `${(Math.random() * 10000).toFixed(2)} SEI` : undefined,
          from: `sei1${Math.random().toString(36).substring(7)}`,
          to: `sei1${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toLocaleTimeString(),
          txHash: `0x${Math.random().toString(16).substring(2, 10)}`,
          blockHeight: Math.floor(Math.random() * 1000000) + 5000000,
          gasUsed: `${Math.floor(Math.random() * 100000) + 10000}`,
          fee: `${(Math.random() * 0.01).toFixed(4)} SEI`
        };

        setFeedItems(prev => [simulatedEvent, ...prev.slice(0, 49)]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [connectionStatus, isPaused]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-blue-500/20 text-blue-400';
      case 'mint': return 'bg-green-500/20 text-green-400';
      case 'swap': return 'bg-yellow-500/20 text-yellow-400';
      case 'contract': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'connecting': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live SEI MCP Feed';
      case 'connecting': return 'Connecting to MCP...';
      case 'error': return 'Demo Mode (MCP Offline)';
      default: return 'Unknown Status';
    }
  };

  const handleViewDetails = (item: BlockchainEvent) => {
    setSelectedTransaction(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="glass-card p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
            {getConnectionStatusText()}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
              size="sm"
              className="border-green-600/50 hover:border-green-500 bg-black"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            {connectionStatus === 'error' && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="border-yellow-600/50 hover:border-yellow-500 bg-black text-yellow-400"
              >
                Retry MCP
              </Button>
            )}
          </div>
        </div>

        {connectionStatus === 'error' && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ MCP Server unavailable. Showing simulated data for demo purposes.
            </p>
          </div>
        )}

        <div className="space-y-3 overflow-y-auto max-h-96">
          {feedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Waiting for blockchain events...</p>
              {connectionStatus === 'connecting' && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto"></div>
                </div>
              )}
            </div>
          ) : (
            feedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-black border border-green-500/30 rounded-lg hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{item.timestamp}</span>
                </div>
                
                <p className="text-sm text-white mb-2">{item.description}</p>
                
                {item.amount && (
                  <p className="text-sm text-green-400 font-medium">{item.amount}</p>
                )}

                {item.blockHeight && (
                  <p className="text-xs text-gray-400">Block: {item.blockHeight}</p>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>TX: {item.txHash}</span>
                  <button 
                    onClick={() => handleViewDetails(item)}
                    className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default LiveFeed;