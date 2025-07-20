
import { useState } from 'react';
import { 
  Home, 
  Search, 
  LayoutDashboard,
  Circle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const sidebarItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: Search, label: 'Wallet Watcher' },
  { icon: LayoutDashboard, label: 'Token Flow' },
  { icon: Circle, label: 'NFT Activity' },
  { icon: LayoutDashboard, label: 'AI Assistant' },
  { icon: Circle, label: 'Alerts' },
];

const Sidebar = ({ isOpen = false, onClose, isMobile = false }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleItemClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={cn(
      "transition-all duration-300 bg-black/95 backdrop-blur-lg border-r border-green-500/40",
      "flex flex-col h-full",
      isMobile ? "w-64 fixed left-0 top-0" : (collapsed ? "w-16" : "w-64")
    )}>
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium text-gray-400">NAVIGATION</span>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg hover:bg-black border border-green-500/20 hover:border-green-500/40 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={handleItemClick}
              className={cn(
                "w-full flex items-center px-3 py-3 md:py-2 rounded-lg transition-all duration-200",
                "text-left group relative",
                item.active 
                  ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                  : "text-gray-400 hover:text-white hover:bg-green-500/10 border border-green-500/20 hover:border-green-500/40"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
              )}
              {/* Tooltip for collapsed desktop view */}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black border border-green-500/40 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer - Connection Status */}
      <div className="mt-auto p-4 border-t border-green-500/40">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/40",
          collapsed && !isMobile && "justify-center"
        )}>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-green-400 truncate">SEI MCP Server</p>
              <p className="text-xs text-gray-400 truncate">Connected & Listening</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
