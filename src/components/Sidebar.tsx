
import { useState } from 'react';
import { 
  Home, 
  Search, 
  LayoutDashboard,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: Search, label: 'Wallet Watcher' },
  { icon: LayoutDashboard, label: 'Token Flow' },
  { icon: Circle, label: 'NFT Activity' },
  { icon: LayoutDashboard, label: 'AI Assistant' },
  { icon: Circle, label: 'Alerts' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "transition-all duration-300 glass-card border-r border-green-500/20",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <span className="text-sm font-medium text-gray-400">NAVIGATION</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200",
                item.active 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-gray-400 hover:text-white hover:bg-secondary"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg bg-green-900/20 border border-green-500/30",
          collapsed && "justify-center"
        )}>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-green"></div>
          {!collapsed && (
            <div>
              <p className="text-xs font-medium text-green-400">SEI MCP Server</p>
              <p className="text-xs text-gray-400">Connected & Listening</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
