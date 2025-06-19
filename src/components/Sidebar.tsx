'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isCollapsed, toggleSidebar }: SidebarProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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
      name: 'LaunchLite', 
      href: '/launchlite', 
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
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
  ];

  const getPageInfo = () => {
    switch (pathname) {
      case '/audit':
        return {
          title: 'AuditAI',
          subtitle: 'Smart Contract Auditor',
          description: 'AI powered smart contract analysis available 24/7'
        };
      case '/token-investigation':
        return {
          title: 'RugTrace',
          subtitle: 'Token Investigation',
          description: 'Advanced token and developer history analysis'
        };
      case '/token-security':
        return {
          title: 'CodeReveal',
          subtitle: 'Security Analyzer',
          description: 'Advanced token security analysis and risk assessment'
        };
      case '/contract-deploy':
        return {
          title: 'LaunchLite',
          subtitle: 'Token Deployment',
          description: 'Deploy custom ERC20 tokens with advanced features'
        };
      default:
        return {
          title: 'TraceonAI',
          subtitle: 'Dashboard',
          description: 'AI powered smart contract analysis available 24/7'
        };
    }
  };

  const pageInfo = getPageInfo();
  if (!mounted) return null;

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
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link 
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:shadow-md hover:shadow-purple-500/5 ${
                  pathname === link.href 
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10 shadow-md shadow-purple-500/5' 
                    : 'border border-transparent'
                }`}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      className="text-sm font-medium whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className={`mt-auto px-4 pb-6 pt-2 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full mb-4"></div>
        <div className="backdrop-blur-sm bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-white/10 shadow-inner">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <p className="text-sm font-medium">AI Assistant</p>
              <p className="text-xs opacity-70 uppercase tracking-wide">Online</p>
            </div>
          </div>
          <p className="text-xs opacity-80">{pageInfo.description}</p>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar; 