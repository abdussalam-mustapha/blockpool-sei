import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';

const DashboardPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed' : 'relative'}
          ${isMobile ? 'z-50' : 'z-0'}
          transition-transform duration-300 ease-in-out
          ${isMobile ? 'h-full' : ''}
        `}>
          <Sidebar 
            isOpen={true} 
            onClose={() => {}}
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
