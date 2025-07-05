
import { Card } from '@/components/ui/card';
import AIAssistant from './AIAssistant';
import LiveFeed from './LiveFeed';
import AnalyticsWidgets from './AnalyticsWidgets';

const Dashboard = () => {
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

      {/* Status Card */}
      <Card className="bg-black border border-green-500/50 glow-green p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-green"></div>
            <div>
              <h3 className="font-semibold text-white">SEI MCP Server Status</h3>
              <p className="text-sm text-gray-400">Connected & actively listening to chain events</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-medium">Online</p>
            <p className="text-xs text-gray-400">Last sync: just now</p>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        <AIAssistant />
        <LiveFeed />
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
        <AnalyticsWidgets />
      </div>
    </div>
  );
};

export default Dashboard;
