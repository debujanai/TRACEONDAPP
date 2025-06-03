'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile';
import MarketSentiment from './MarketSentiment';
import Image from 'next/image';
import LoginModal from './LoginModal';
import { useWallet } from '@/contexts/WalletContext';
import CustomScrollbar from './CustomScrollbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWallet();
  
  useEffect(() => {
    setMounted(true);
    // Check local storage for saved sidebar state
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);
  
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    // Save to local storage
    localStorage.setItem('sidebar-collapsed', String(newState));
  };
  
  if (!mounted) return null;
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Apply custom scrollbar styling */}
      <CustomScrollbar />
      
      {/* Background Image */}
      <div className="fixed top-0 right-0 w-[60%] h-screen -z-10">
        <div className="relative w-full h-full opacity-80">
          <Image 
            src="/aa.png" 
            alt="Background" 
            fill
            priority
            className="object-cover object-left"
          />
        </div>
      </div>
      
      {/* Left Sidebar Component */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* Main Content Area - with transition for sidebar */}
      <div 
        className="min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isSidebarCollapsed ? '80px' : '280px',
          width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)'
        }}
      >
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex gap-8">
            {/* Main content with adjusted width */}
            <div className="flex-1">
              {children}
            </div>

            {/* Right sidebar with user profile and market sentiment */}
            <div className="w-[280px] flex-shrink-0 flex flex-col gap-4 sticky top-6 self-start">
              <UserProfile />
              
              {isConnected && (
                <MarketSentiment />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal />
    </div>
  );
};

export default AppLayout; 