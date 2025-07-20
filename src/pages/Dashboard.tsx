import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="md:hidden fixed top-20 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-black/80 backdrop-blur-sm border-green-500/40 hover:border-green-500/60"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'z-50' : 'z-0'}
          transition-transform duration-300 ease-in-out
          ${isMobile ? 'h-full' : ''}
        `}>
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
        </div>

        {/* Main Content */}
        <main className={`
          flex-1 overflow-auto
          ${isMobile ? 'w-full' : ''}
          transition-all duration-300
        `}>
          <div className="p-4 md:p-6">
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
