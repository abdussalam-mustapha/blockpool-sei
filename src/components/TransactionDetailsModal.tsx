
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';

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

interface TransactionDetailsModalProps {
  transaction: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailsModal = ({ transaction, isOpen, onClose }: TransactionDetailsModalProps) => {
  if (!transaction) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'text-blue-400';
      case 'mint': return 'text-green-400';
      case 'swap': return 'text-yellow-400';
      case 'contract': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-green-500/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Type:</span>
            <span className={`font-medium ${getTypeColor(transaction.type)}`}>
              {transaction.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Description:</span>
            <span className="text-white">{transaction.description}</span>
          </div>

          {transaction.amount && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-green-400 font-medium">{transaction.amount}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-400">From:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-mono">{transaction.from?.slice(0, 12)}...</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(transaction.from || '')}
                className="h-6 w-6 p-0 hover:bg-green-500/20"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">To:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-mono">{transaction.to?.slice(0, 12)}...</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(transaction.to || '')}
                className="h-6 w-6 p-0 hover:bg-green-500/20"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Transaction Hash:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-mono">{transaction.txHash}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(transaction.txHash)}
                className="h-6 w-6 p-0 hover:bg-green-500/20"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Timestamp:</span>
            <span className="text-white">{transaction.timestamp}</span>
          </div>

          <div className="pt-4 border-t border-green-500/30">
            <Button
              onClick={() => window.open(`https://seistream.app/tx/${transaction.txHash}`, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on SEI Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
