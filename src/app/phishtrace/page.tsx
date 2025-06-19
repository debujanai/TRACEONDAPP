'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppLayout from '@/components/AppLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ComingSoon() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Grid background pattern */}
        <div className="absolute inset-0 z-0 opacity-50">
          <Image
            src="/grid-pattern.svg"
            alt="Background Grid"
            fill
            priority
            className="object-cover"
          />
        </div>
        
        {/* Glowing orbs effect */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
          {/* Coming Soon Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block backdrop-blur-md bg-black/20 border border-white/10 rounded-full px-6 py-2 mb-4"
          >
            <span className="text-xs uppercase tracking-widest text-white/70">Coming Soon</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl md:text-6xl font-['ClashGrotesk-Regular'] mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 text-center"
          >
            Exciting Stuff Coming Soon
          </motion.h1>
          
          {/* Back to Home Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8"
          >
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-white/20 hover:border-white/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
} 