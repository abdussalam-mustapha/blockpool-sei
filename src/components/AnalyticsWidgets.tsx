import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { seiMcpClient } from '@/services/seiMcpClient';
import { NetworkSelector } from './NetworkSelector';
import { 
  type SupportedNetwork, 
  getNetworkDisplayName, 
  isEVMMode,
  isNativeMode,
  formatExplorerUrl 
} from '../lib/config';

interface WidgetData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  loading?: boolean;
}

const AnalyticsWidgets = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('sei');
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
  const [previousData, setPreviousData] = useState<any>(null);
  const [isRealTime, setIsRealTime] = useState(false);

  // Calculate percentage change between current and previous values
  const calculateChange = (current: number, previous: number): { change: string; trend: 'up' | 'down' } => {
    if (!previous || previous === 0) return { change: '+0.0%', trend: 'up' };
    const percentChange = ((current - previous) / previous) * 100;
    const change = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
    const trend = percentChange >= 0 ? 'up' : 'down';
    return { change, trend };
  };

  const fetchRealTimeAnalytics = async () => {
    try {
      const connectionStatus = seiMcpClient.getConnectionStatus();
      
      if (connectionStatus.connected) {
        setIsRealTime(true);
        
        // Fetch live blockchain events for real-time calculations with network context
        const recentEvents = await seiMcpClient.getRecentBlockchainEvents(10);
        const marketData = await seiMcpClient.getMarketData();
        const nftActivity = await seiMcpClient.getNFTActivity();
        
        // Log network mode for debugging
        console.log(`[Analytics] Fetching data for ${getNetworkDisplayName(selectedNetwork)} (${isEVMMode(selectedNetwork) ? 'EVM' : 'Native'} mode)`);
        
        // Calculate real-time metrics from blockchain events
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Filter events by time periods
        const recentHourEvents = recentEvents.filter(e => new Date(e.timestamp) > oneHourAgo);
        const recentDayEvents = recentEvents.filter(e => new Date(e.timestamp) > oneDayAgo);
        
        // Calculate metrics
        const tokenInflow = recentDayEvents
          .filter(e => e.type === 'transfer')
          .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        
        const activeWallets = new Set([
          ...recentDayEvents.map(e => e.from),
          ...recentDayEvents.map(e => e.to)
        ]).size;
        
        const nftMints = recentDayEvents.filter(e => e.type === 'mint').length;
        const swapVolume = recentDayEvents
          .filter(e => e.type === 'swap')
          .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        
        const riskyContracts = recentDayEvents
          .filter(e => e.type === 'contract' && parseFloat(e.gasPrice || '0') > 0.01)
          .length;
        
        // Current data
        const currentData = {
          tokenInflow,
          activeWallets,
          nftMints,
          swapVolume,
          riskyContracts
        };
        
        // Calculate changes from previous data
        const tokenInflowChange = previousData ? calculateChange(tokenInflow, previousData.tokenInflow) : { change: '+0.0%', trend: 'up' as const };
        const activeWalletsChange = previousData ? calculateChange(activeWallets, previousData.activeWallets) : { change: '+0.0%', trend: 'up' as const };
        const nftMintsChange = previousData ? calculateChange(nftMints, previousData.nftMints) : { change: '+0.0%', trend: 'up' as const };
        const swapVolumeChange = previousData ? calculateChange(swapVolume, previousData.swapVolume) : { change: '+0.0%', trend: 'up' as const };
        const riskyContractsChange = previousData ? calculateChange(riskyContracts, previousData.riskyContracts) : { change: '+0.0%', trend: 'down' as const };
        
        // Update widgets with real-time data
        setWidgets([
          {
            title: 'Token Inflow/Outflow',
            value: `$${(tokenInflow * 0.67).toFixed(1)}K`, // Convert SEI to USD approximation
            change: tokenInflowChange.change,
            trend: tokenInflowChange.trend
          },
          {
            title: 'Active Wallets',
            value: activeWallets.toLocaleString(),
            change: activeWalletsChange.change,
            trend: activeWalletsChange.trend
          },
          {
            title: 'NFTs Minted Today',
            value: nftMints.toString(),
            change: nftMintsChange.change,
            trend: nftMintsChange.trend
          },
          {
            title: 'Top Token Volume',
            value: 'SEI',
            change: `$${(swapVolume * 0.67).toFixed(0)}K`,
            trend: swapVolumeChange.trend
          },
          {
            title: 'Risky Contracts',
            value: riskyContracts.toString(),
            change: riskyContractsChange.change,
            trend: riskyContractsChange.trend
          },
          {
            title: 'Swap Volume',
            value: `$${(swapVolume * 0.67).toFixed(1)}K`,
            change: swapVolumeChange.change,
            trend: swapVolumeChange.trend
          }
        ]);
        
        // Store current data for next comparison
        setPreviousData(currentData);
        setLastUpdate(new Date().toLocaleTimeString());
        
      } else {
        setIsRealTime(false);
        // Use simulated real-time data when MCP is not connected
        const simulatedData = [
          {
            title: 'Token Inflow/Outflow',
            value: `$${(Math.random() * 2000 + 800).toFixed(1)}K`,
            change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 20).toFixed(1)}%`,
            trend: Math.random() > 0.5 ? 'up' as const : 'down' as const
          },
          {
            title: 'Active Wallets',
            value: (Math.floor(Math.random() * 5000) + 5000).toLocaleString(),
            change: `+${(Math.random() * 15).toFixed(1)}%`,
            trend: 'up' as const
          },
          {
            title: 'NFTs Minted Today',
            value: (Math.floor(Math.random() * 500) + 100).toString(),
            change: `${Math.random() > 0.6 ? '+' : '-'}${(Math.random() * 30).toFixed(1)}%`,
            trend: Math.random() > 0.6 ? 'up' as const : 'down' as const
          },
          {
            title: 'Top Token Volume',
            value: 'SEI',
            change: `$${(Math.random() * 1000 + 500).toFixed(0)}K`,
            trend: 'up' as const
          },
          {
            title: 'Risky Contracts',
            value: Math.floor(Math.random() * 10).toString(),
            change: `-${(Math.random() * 50).toFixed(1)}%`,
            trend: 'down' as const
          },
          {
            title: 'Swap Volume',
            value: `$${(Math.random() * 1500 + 500).toFixed(1)}K`,
            change: `+${(Math.random() * 25).toFixed(1)}%`,
            trend: 'up' as const
          }
        ];
        
        setWidgets(simulatedData);
        setLastUpdate('now');
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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        await fetchRealTimeAnalytics();
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

    // Set up periodic updates every 15 seconds for real-time feel
    const interval = setInterval(fetchAnalyticsData, 15000);

    // Listen for market updates from MCP
    const handleMarketUpdate = (data: any) => {
      fetchAnalyticsData();
    };

    seiMcpClient.on('marketUpdate', handleMarketUpdate);

    return () => {
      clearInterval(interval);
      seiMcpClient.off('marketUpdate', handleMarketUpdate);
    };
  }, [previousData]);

  // Refetch data when network changes
  useEffect(() => {
    fetchRealTimeAnalytics();
  }, [selectedNetwork]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <NetworkSelector 
        selectedNetwork={selectedNetwork}
        onNetworkChange={setSelectedNetwork}
      />
      {lastUpdate && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <p className="text-xs sm:text-sm text-gray-400">
            Last updated: {lastUpdate}
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Auto-updating</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {widgets.map((widget, index) => (
          <Card
            key={index}
            className="glass-card p-3 sm:p-4 lg:p-6 hover:border-primary/30 transition-all duration-300 hover:glow-green cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <h4 className="text-xs sm:text-sm font-medium text-gray-400 leading-tight pr-2">
                {widget.title}
              </h4>
              <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                widget.trend === 'up' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {widget.loading ? (
                  <div className="w-6 sm:w-8 h-3 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  widget.change
                )}
              </div>
            </div>
            
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              {widget.loading ? (
                <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                <span className="break-all">{widget.value}</span>
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