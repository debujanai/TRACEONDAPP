'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useToken } from '@/contexts/TokenContext';

const TokenNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { showAllData, setShowAllData } = useToken();

  const tabs = [
    { name: 'Overview', path: '/rugtrace/overview' },
    { name: 'Security', path: '/rugtrace/security' },
    { name: 'Liquidity', path: '/rugtrace/liquidity' },
    { name: 'Traders', path: '/rugtrace/traders' },
    { name: 'Wallets', path: '/rugtrace/wallets' }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive(tab.path) 
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => setShowAllData(!showAllData)}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          showAllData 
            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
            : 'bg-black/30 hover:bg-white/10 border border-white/10'
        }`}
      >
        {showAllData ? 'Hide Raw Data' : 'Show Raw Data'}
      </button>
    </div>
  );
};

export default TokenNavigation; 