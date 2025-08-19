'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessaging } from '@/contexts/MessagingContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isCollapsed, toggleSidebar }: SidebarProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { unreadCount } = useMessaging();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      )
    },
    { 
      name: 'CodeReveal', 
      href: '/codereveal', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      )
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22 6 12 13 2 6"></polyline>
        </svg>
      ),
      hasNotification: unreadCount > 0,
      notificationCount: unreadCount
    },
    { 
      name: 'API Docs', 
      href: 'https://docs.traceonai.io', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    },    
    { 
      name: 'RugTrace', 
      href: '/rugtrace', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      )
    },
    { 
      name: 'PhishTrace', 
      href: '/phishtrace', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <circle cx="12" cy="11" r="1"></circle>
          <path d="M12 8v2"></path>
          <path d="M12 14v2"></path>
        </svg>
      )
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ) 
    },
    { 
      name: 'Assistant AI', 
      href: '/comingsoon', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
      )
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    }
  ];

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null;
  }

  return (
    <motion.aside 
      className={`backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 border-r border-white/10 shadow-lg fixed top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Collapse Button */}
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-12 bg-gradient-to-r from-purple-500 to-blue-500 p-1 rounded-full shadow-lg hover:shadow-purple-500/30 transition-all z-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}>
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* Logo Section */}
      <div className={`p-6 pb-2 ${isCollapsed ? 'items-center justify-center flex flex-col p-4 pb-0' : ''}`}>
        <div className={`relative mb-4 transition-all duration-300 ${isCollapsed ? 'w-10 h-10 mb-2' : 'w-40 h-10'}`}>
          <AnimatePresence initial={false} mode="wait">
            {isCollapsed ? (
              <motion.div 
                key="collapsed-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src="/logo.png"
                  alt="TraceOn Logo"
                  fill
                  priority
                  className="rounded-2xl object-contain"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="expanded-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src="/logo4.png"
                  alt="TraceOn Logo"
                  fill
                  priority
                  className="rounded-2xl object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className={`px-4 py-2 ${isCollapsed ? 'mt-1 py-0' : 'mt-2'}`}>
        <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full ${isCollapsed ? 'mt-1 mb-2' : 'mt-0 mb-2'}`}></div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
        <ul className="space-y-2">
          {navLinks.map((link, index) => (
            <motion.li 
              key={link.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Link 
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:shadow-md hover:shadow-purple-500/5 relative ${
                  pathname === link.href 
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10 shadow-md shadow-purple-500/5' 
                    : 'border border-transparent'
                }`}
                target={link.href.startsWith('http') ? '_blank' : undefined}
              >
                <span className="flex-shrink-0 relative">
                  {link.icon}
                  {/* Notification Badge */}
                  {link.hasNotification && link.notificationCount && link.notificationCount > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      {link.notificationCount > 99 ? '99+' : link.notificationCount}
                    </motion.div>
                  )}
                </span>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      className="flex items-center justify-between flex-1"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-sm font-medium whitespace-nowrap">
                        {link.name}
                      </span>
                      {/* Notification Badge for expanded sidebar */}
                      {link.hasNotification && link.notificationCount && link.notificationCount > 0 && (
                        <motion.div
                          className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg ml-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {link.notificationCount > 99 ? '99+' : link.notificationCount}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer/Version Info */}
      <motion.div 
        className="p-4 border-t border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-white/50">TraceOn v2.0</p>
              <p className="text-xs text-white/30">Security Analytics</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar; 