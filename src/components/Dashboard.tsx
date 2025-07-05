import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import AIAssistant from './AIAssistant';
import LiveFeed from './LiveFeed';
import AnalyticsWidgets from './AnalyticsWidgets';
import { seiMcpClient } from '@/services/seiMcpClient';

const Dashboard = () => {
  const [mcpStatus, setMcpStatus] = useState<{
    connected: boolean;
    attempts: number;
    lastSync?: string;
  }>({
    connected: false,
    attempts: 0
  });

  useEffect(() => {
    // Monitor MCP connection status
    const updateStatus = () => {
      const status = seiMcpClient.getConnectionStatus();
      setMcpStatus({
        ...status,
        lastSync: status.connected ? 'just now' : undefined
      });
    };

    // Initial status check
    updateStatus();

    // Listen for connection changes
    const handleConnectionChange = (status: any) => {
      updateStatus();
    };

    seiMcpClient.on('connection', handleConnectionChange);

    // Update "last sync" time periodically when connected
    const syncInterval = setInterval(() => {
      if (mcpStatus.connected) {
        setMcpStatus(prev => ({
          ...prev,
          lastSync: 'just now'
        }));
      }
    }, 30000); // Update every 30 seconds

    return () => {
      seiMcpClient.off('connection', handleConnectionChange);
      clearInterval(syncInterval);
    };
  }, [mcpStatus.connected]);

  const getStatusColor = () => {
    if (mcpStatus.connected) return 'border-green-500/50 glow-green';
    if (mcpStatus.attempts > 0) return 'border-yellow-500/50';
    return 'border-red-500/50';
  };

  const getStatusText = () => {
    if (mcpStatus.connected) return 'Connected & actively listening to chain events';
    if (mcpStatus.attempts > 0) return `Reconnecting... (attempt ${mcpStatus.attempts})`;
    return 'Disconnected from SEI MCP Server';
  };

  const getStatusIndicator = () => {
    if (mcpStatus.connected) return 'Online';
    if (mcpStatus.attempts > 0) return 'Reconnecting';
    return 'Offline';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to Blockpool
        </h1>
        <p className="text-gray-400">
          Your AI-powered companion for SEI blockchain analytics and insights
        </p>
      </div>

      {/* MCP Status Card */}
      <Card className={`bg-black p-6 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              mcpStatus.connected 
                ? 'bg-green-400 animate-pulse-green' 
                : mcpStatus.attempts > 0 
                  ? 'bg-yellow-400 animate-pulse' 
                  : 'bg-red-400'
            }`}></div>
            <div>
              <h3 className="font-semibold text-white">SEI MCP Server Status</h3>
              <p className="text-sm text-gray-400">{getStatusText()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-medium ${
              mcpStatus.connected 
                ? 'text-green-400' 
                : mcpStatus.attempts > 0 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
            }`}>
              {getStatusIndicator()}
            </p>
            {mcpStatus.lastSync && (
              <p className="text-xs text-gray-400">Last sync: {mcpStatus.lastSync}</p>
            )}
            {!mcpStatus.connected && mcpStatus.attempts === 0 && (
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-blue-400 hover:text-blue-300 underline mt-1"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>

        {/* Connection Details */}
        {mcpStatus.connected && (
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Protocol</p>
                <p className="text-white">MCP 2024-11-05</p>
              </div>
              <div>
                <p className="text-gray-400">Events</p>
                <p className="text-white">Subscribed</p>
              </div>
              <div>
                <p className="text-gray-400">Data Stream</p>
                <p className="text-green-400">Live</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!mcpStatus.connected && mcpStatus.attempts === 0 && (
          <div className="mt-4 pt-4 border-t border-red-500/30">
            <p className="text-sm text-red-400">
              ⚠️ Unable to connect to SEI MCP Server. Some features may use simulated data.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Ensure the MCP server is running on localhost:3001 or check your connection.
            </p>
          </div>
        )}
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        <AIAssistant />
        <LiveFeed />
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
          {mcpStatus.connected && (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          )}
        </div>
        <AnalyticsWidgets />
      </div>
    </div>
  );
};

export default Dashboard;