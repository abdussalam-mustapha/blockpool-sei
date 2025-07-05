
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-green-500/20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/337ff584-1631-4788-98f0-5d71989f7c8c.png" 
              alt="Blockpool Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-white">Blockpool</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Home</a>
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Docs</a>
            <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Chain Explorer</a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search addresses, tokens..."
              className="bg-secondary border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <Button
            onClick={() => setIsConnected(!isConnected)}
            className={`${
              isConnected 
                ? 'bg-green-600 hover:bg-green-700 glow-green' 
                : 'bg-primary hover:bg-primary/90'
            } font-medium`}
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
