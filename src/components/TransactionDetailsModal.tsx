import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { type BlockchainEvent } from '@/services/seiMcpClient';
import { formatDetailedTimestamp } from '@/utils/dateUtils';

interface TransactionDetailsModalProps {
  transaction: BlockchainEvent | null;
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
            <span className="text-white text-right max-w-[200px]">{transaction.description}</span>
          </div>

          {transaction.amount && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-green-400 font-medium">{transaction.amount}</span>
            </div>
          )}

          {transaction.blockHeight && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Block Height:</span>
              <span className="text-white">{transaction.blockHeight.toLocaleString()}</span>
            </div>
          )}

          {transaction.gasUsed && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Gas Used:</span>
              <span className="text-white">{transaction.gasUsed}</span>
            </div>
          )}

          {transaction.fee && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fee:</span>
              <span className="text-white">{transaction.fee}</span>
            </div>
          )}

          {transaction.from && (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">From:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(transaction.from || '')}
                    className="h-6 p-1 hover:bg-green-500/20 text-xs"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`https://seistream.app/address/${transaction.from}`, '_blank')}
                    className="h-6 p-1 hover:bg-green-500/20 text-xs"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> View
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 p-2 rounded-md">
                <span className="text-white text-sm font-mono break-all">{transaction.from}</span>
              </div>
            </div>
          )}

          {transaction.to && (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">To:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(transaction.to || '')}
                    className="h-6 p-1 hover:bg-green-500/20 text-xs"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`https://seistream.app/address/${transaction.to}`, '_blank')}
                    className="h-6 p-1 hover:bg-green-500/20 text-xs"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> View
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 p-2 rounded-md">
                <span className="text-white text-sm font-mono break-all">{transaction.to}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Transaction Hash:</span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(transaction.txHash)}
                  className="h-6 p-1 hover:bg-green-500/20 text-xs"
                  title="Copy transaction hash"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>
            <div className="bg-gray-900 p-2 rounded-md">
              <span className="text-white text-sm font-mono break-all">{transaction.txHash}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Timestamp:</span>
            <span className="text-white">{formatDetailedTimestamp(transaction.timestamp)}</span>
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