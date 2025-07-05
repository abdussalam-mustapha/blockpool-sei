import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionDetailsModal from './TransactionDetailsModal';

interface FeedItem {
  id: string;
  type: 'transfer' | 'mint' | 'swap' | 'contract';
  description: string;
  amount?: string;
  from?: string;
  to?: string;
  timestamp: string;
  txHash: string;
}

const LiveFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FeedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulate real-time feed
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newItem: FeedItem = {
        id: Math.random().toString(),
        type: ['transfer', 'mint', 'swap', 'contract'][Math.floor(Math.random() * 4)] as any,
        description: [
          'Token transfer detected',
          'NFT minted',
          'DEX swap executed',
          'Smart contract interaction'
        ][Math.floor(Math.random() * 4)],
        amount: Math.random() > 0.5 ? `${(Math.random() * 1000).toFixed(2)} SEI` : undefined,
        from: `sei1${Math.random().toString(36).substring(7)}`,
        to: `sei1${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toLocaleTimeString(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}`
      };

      setFeedItems(prev => [newItem, ...prev.slice(0, 49)]); // Keep last 50 items
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-blue-500/20 text-blue-400';
      case 'mint': return 'bg-green-500/20 text-green-400';
      case 'swap': return 'bg-yellow-500/20 text-yellow-400';
      case 'contract': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleViewDetails = (item: FeedItem) => {
    setSelectedTransaction(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="glass-card p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live Blockchain Feed
          </h3>
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="outline"
            size="sm"
            className="border-green-600/50 hover:border-green-500 bg-black"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-96">
          {feedItems.map((item) => (
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
          ))}
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
