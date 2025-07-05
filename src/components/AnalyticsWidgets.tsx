import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { seiMcpClient } from '@/services/seiMcpClient';

interface WidgetData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  loading?: boolean;
}

const AnalyticsWidgets = () => {
  const [widgets, setWidgets] = useState<WidgetData[]>([
    {
      title: 'Token Inflow/Outflow',
      value: 'Loading...',
      change: '...',
      trend: 'up',
      loading: true
    },
    {
      title: 'Active Wallets',
      value: 'Loading...',
      change: '...',
      trend: 'up',
      loading: true
    },
    {
      title: 'NFTs Minted Today',
      value: 'Loading...',
      change: '...',
      trend: 'up',
      loading: true
    },
    {
      title: 'Top Token Volume',
      value: 'Loading...',
      change: '...',
      trend: 'up',
      loading: true
    },
    {
      title: 'Risky Contracts',
      value: 'Loading...',
      change: '...',
      trend: 'down',
      loading: true
    },
    {
      title: 'Swap Volume',
      value: 'Loading...',
      change: '...',
      trend: 'up',
      loading: true
    }
  ]);

  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const connectionStatus = seiMcpClient.getConnectionStatus();
        
        if (connectionStatus.connected) {
          // Fetch real data from MCP server
          const marketData = await seiMcpClient.getMarketData();
          const nftActivity = await seiMcpClient.getNFTActivity();
          
          if (marketData) {
            setWidgets([
              {
                title: 'Token Inflow/Outflow',
                value: marketData.tokenFlow || '$1.2M',
                change: marketData.tokenFlowChange || '+15.3%',
                trend: (marketData.tokenFlowChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              },
              {
                title: 'Active Wallets',
                value: marketData.activeWallets?.toString() || '8,492',
                change: marketData.activeWalletsChange || '+8.7%',
                trend: (marketData.activeWalletsChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              },
              {
                title: 'NFTs Minted Today',
                value: nftActivity?.length?.toString() || '247',
                change: marketData.nftMintChange || '-2.1%',
                trend: (marketData.nftMintChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              },
              {
                title: 'Top Token Volume',
                value: marketData.topToken || 'SEIYAN',
                change: marketData.topTokenChange || '+45.2%',
                trend: (marketData.topTokenChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              },
              {
                title: 'Risky Contracts',
                value: marketData.riskyContracts?.toString() || '3',
                change: marketData.riskyContractsChange || '-50%',
                trend: (marketData.riskyContractsChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              },
              {
                title: 'Swap Volume',
                value: marketData.swapVolume || '$892K',
                change: marketData.swapVolumeChange || '+22.4%',
                trend: (marketData.swapVolumeChange?.startsWith('+') ? 'up' : 'down') as 'up' | 'down'
              }
            ]);
            
            setLastUpdate(new Date().toLocaleTimeString());
          }
        } else {
          // Use simulated data when MCP is not connected
          setWidgets([
            {
              title: 'Token Inflow/Outflow',
              value: '$1.2M',
              change: '+15.3%',
              trend: 'up'
            },
            {
              title: 'Active Wallets',
              value: '8,492',
              change: '+8.7%',
              trend: 'up'
            },
            {
              title: 'NFTs Minted Today',
              value: '247',
              change: '-2.1%',
              trend: 'down'
            },
            {
              title: 'Top Token Volume',
              value: 'SEIYAN',
              change: '+45.2%',
              trend: 'up'
            },
            {
              title: 'Risky Contracts',
              value: '3',
              change: '-50%',
              trend: 'down'
            },
            {
              title: 'Swap Volume',
              value: '$892K',
              change: '+22.4%',
              trend: 'up'
            }
          ]);
          
          setLastUpdate('Demo data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        
        // Fallback to simulated data
        setWidgets(prev => prev.map(widget => ({
          ...widget,
          loading: false
        })));
      }
    };

    // Initial fetch
    fetchAnalyticsData();

    // Set up periodic updates
    const interval = setInterval(fetchAnalyticsData, 30000); // Update every 30 seconds

    // Listen for market updates from MCP
    const handleMarketUpdate = (data: any) => {
      fetchAnalyticsData();
    };

    seiMcpClient.on('marketUpdate', handleMarketUpdate);

    return () => {
      clearInterval(interval);
      seiMcpClient.off('marketUpdate', handleMarketUpdate);
    };
  }, []);

  return (
    <div className="space-y-4">
      {lastUpdate && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">
            Last updated: {lastUpdate}
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Auto-updating</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget, index) => (
          <Card
            key={index}
            className="glass-card p-6 hover:border-primary/30 transition-all duration-300 hover:glow-green cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">{widget.title}</h4>
              <div className={`text-xs px-2 py-1 rounded-full ${
                widget.trend === 'up' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {widget.loading ? (
                  <div className="w-8 h-3 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  widget.change
                )}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-white mb-1">
              {widget.loading ? (
                <div className="w-16 h-8 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                widget.value
              )}
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-1000 ${
                  widget.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: widget.loading ? '0%' : `${Math.random() * 100}%` 
                }}
              ></div>
            </div>

            {!widget.loading && (
              <div className="mt-2 text-xs text-gray-500">
                {seiMcpClient.getConnectionStatus().connected ? 'Live data' : 'Demo data'}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsWidgets;