import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Agent showcase data
  const agents = [
    {
      id: "comingsoon",
      title: "CodeReveal",
      category: "Blockchain Security",
      description: "Analyze token security risks, detect vulnerabilities, and assess overall risk level with our AI-powered security analyzer. Our comprehensive scanning tools help identify potential exploits, backdoors, and risky code patterns before they can be exploited.",
      accent: "#7764ff", // Purple
      tags: ['Smart Contract', 'Vulnerability Detection', 'Risk Assessment', 'AI-Powered', 'Audit'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      )
    },
    {
      id: "launchlite",
      title: "LaunchLite",
      category: "Deploy Custom Tokens",
      description: "Deploy custom ERC20 tokens with advanced features using our secure, audited templates and deployment tools. Our streamlined platform enables you to customize token parameters, implement vesting schedules, and deploy with confidence to any EVM-compatible blockchain.",
      accent: "#4ade80", // Green
      tags: ['ERC20', 'Custom Tokens', 'Gas Optimized', 'Multi-Chain', 'Secure Templates'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    },
    {
      id: "comingsoon",
      title: "RugTrace",
      category: "Advanced Analytics",
      description: "Advanced token investigation tools to trace developer history, analyze transaction patterns, and detect suspicious activity. Our powerful analytics engine provides deep insights into token holder distribution, liquidity patterns, and historical price movements.",
      accent: "#f87171", // Red
      tags: ['On-Chain Analysis', 'Holder Distribution', 'Transaction Patterns', 'Liquidity Tracking', 'Risk Detection'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      )
    }
  ];

  // Memoize the nextSlide function to avoid recreating it on each render
  const nextSlide = useCallback(() => {
    const newIndex = (activeIndex + 1) % agents.length;
    setIsAnimating(true);
    setActiveIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 700);
  }, [activeIndex, agents.length]);
  
  const prevSlide = useCallback(() => {
    const newIndex = (activeIndex - 1 + agents.length) % agents.length;
    setIsAnimating(true);
    setActiveIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 700);
  }, [activeIndex, agents.length]);
  
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === activeIndex) return;
    setIsAnimating(true);
    setActiveIndex(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [activeIndex, isAnimating]);

  // Pause rotation when hovering
  const pauseRotation = () => setIsPaused(true);
  const resumeRotation = () => setIsPaused(false);

  // Handle auto-rotation with useEffect
  useEffect(() => {
    if (isPaused) return;

    // Clear any existing timeouts
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    
    // Set a new timeout for the next slide
    autoPlayRef.current = setTimeout(() => {
      nextSlide();
    }, 8000);
    
    // Cleanup on unmount or when activeIndex changes
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
          }
    };
  }, [activeIndex, isPaused, nextSlide]);

  // Animation variants for staggered reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Get current agent data
  const currentAgent = agents[activeIndex];

  return (
    <div 
      className="w-full h-[600px] relative bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
      onMouseEnter={pauseRotation}
      onMouseLeave={resumeRotation}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-10">
        <motion.div 
          ref={progressBarRef}
          className="h-full"
              style={{
            backgroundColor: currentAgent.accent,
            width: isPaused ? "100%" : "0%" 
          }}
          animate={{ 
            width: isPaused ? "100%" : "100%" 
          }}
          transition={{ 
            duration: isPaused ? 0 : 8, 
            ease: "linear" 
          }}
          key={`progress-${activeIndex}-${isPaused}`}
        />
      </div>
      
      {/* Main carousel content with AnimatePresence for proper exit animations */}
      <div className="h-full w-full flex items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={`slide-${activeIndex}`}
            className="w-full h-full grid grid-cols-1 lg:grid-cols-2 p-8 pb-16"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left side: Content */}
            <motion.div 
              className="flex flex-col justify-center p-4 lg:p-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${currentAgent.accent}20` }}>
                  <div className="text-[28px]" style={{ color: currentAgent.accent }}>
                    {currentAgent.icon}
                    </div>
                    </div>
                <div className="text-sm uppercase tracking-wider opacity-70">{currentAgent.category}</div>
              </motion.div>
              
              <motion.h2 
                variants={itemVariants} 
                className="text-5xl font-bold mb-6"
                style={{ 
                  background: `linear-gradient(to right, #fff, ${currentAgent.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {currentAgent.title}
              </motion.h2>
              
              <motion.div variants={itemVariants} className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {currentAgent.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: `${currentAgent.accent}20`,
                        border: `1px solid ${currentAgent.accent}40`,
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
              
              <motion.p variants={itemVariants} className="text-base opacity-80 mb-8 leading-relaxed">
                {currentAgent.description}
              </motion.p>
              
              <motion.div variants={itemVariants}>
                <a 
                  href={`/${currentAgent.id.toLowerCase()}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all hover:translate-y-[-2px]"
                  style={{ 
                    background: `linear-gradient(to right, ${currentAgent.accent}, ${currentAgent.accent}90)`,
                    boxShadow: `0 4px 20px ${currentAgent.accent}40`
                  }}
                >
                  Explore {currentAgent.title}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </motion.div>
            </motion.div>
            
            {/* Right side: Visual - REDESIGNED */}
            <motion.div 
              className="relative flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative w-[85%] aspect-square max-h-[85%]">
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-60 blur-2xl"
                  style={{ 
                    background: `radial-gradient(circle at center, ${currentAgent.accent}40 0%, transparent 70%)`,
                  }}
                />
                
                {/* Main card with slight perspective */}
                <motion.div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden p-8 flex flex-col items-center justify-center text-center"
                  style={{
                    boxShadow: `0 0 30px ${currentAgent.accent}30`,
                    borderColor: `${currentAgent.accent}30`
                  }}
                  initial={{ rotateY: 10, rotateX: -10 }}
                  animate={{ 
                    rotateY: [10, -5, 10],
                    rotateX: [-10, 5, -10]
                  }}
                  transition={{ 
                    duration: 15, 
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                >
                  {/* Accent border */}
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, ${currentAgent.accent}20 50%, transparent 100%)`,
                      border: `1px solid ${currentAgent.accent}30`,
                      opacity: 0.6
                    }}
                  />
                  
                  {/* Glowing icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mb-8 relative"
                  >
                    <div
                      className="absolute -inset-4 rounded-full opacity-20 blur-lg"
                      style={{ 
                        background: `radial-gradient(circle at center, ${currentAgent.accent} 0%, transparent 70%)`,
                      }}
                    />
                    <div 
                      className="relative w-20 h-20 flex items-center justify-center rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentAgent.accent}10, ${currentAgent.accent}30)`,
                        boxShadow: `0 0 20px ${currentAgent.accent}50`,
                        border: `1px solid ${currentAgent.accent}50`
                      }}
                    >
                      <div style={{ color: currentAgent.accent }}>
                        {currentAgent.icon}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Code brackets decoration */}
                  <div className="absolute left-1/4 top-1/3 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={currentAgent.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                    </svg>
                  </div>
                  <div className="absolute right-1/4 bottom-1/3 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={currentAgent.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-xl font-medium mb-3"
                  >
                    Powered by AI
                  </motion.div>
                  
                  <motion.div 
                    className="opacity-70 text-sm max-w-[80%]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    Advanced machine learning algorithms and blockchain analytics working together to provide actionable insights.
                  </motion.div>
                </motion.div>
                
                {/* Subtle floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute w-1 h-1 rounded-full"
                      style={{ 
                        backgroundColor: currentAgent.accent,
                        left: `${30 + (i * 10)}%`,
                        top: `${20 + (i * 15)}%`,
                        opacity: 0.4
                      }}
                      animate={{ 
                        y: [0, -20, 0],
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{ 
                        duration: 3 + i,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        </div>
        
      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-0 w-full flex justify-center gap-2 z-10">
        {agents.map((_, idx) => (
          <button 
            key={idx}
            className={`w-3 h-3 rounded-full transition-all ${idx === activeIndex ? 'w-10' : ''}`}
            style={{ 
              backgroundColor: idx === activeIndex ? agents[idx].accent : '#ffffff20',
              border: idx === activeIndex ? `1px solid ${agents[idx].accent}` : '1px solid rgba(255,255,255,0.2)'
            }}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
          ))}
      </div>
      
      {/* Arrow Controls */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center z-10 hover:bg-black/50 transition-all"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center z-10 hover:bg-black/50 transition-all"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default ProductCarousel; 