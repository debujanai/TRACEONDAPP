'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Agent = {
  id: number;
  title: string;
  description: string;
  icon: string;
  href: string;
};

type AgentSliderProps = {
  agents: Agent[];
};

const AgentSlider = ({ agents }: AgentSliderProps) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  const handleSlideChange = useCallback((index: number, slideDirection: 'left' | 'right') => {
    if (transitioning || index === activeIndex) return;
    
    setDirection(slideDirection);
    setTransitioning(true);
    setActiveIndex(index);
    
    // Reset transitioning after animation completes
    setTimeout(() => {
      setTransitioning(false);
      setDirection(null);
    }, 500);
  }, [transitioning, activeIndex]);
  
  const handlePrevSlide = useCallback(() => {
    const prevIndex = activeIndex === 0 ? agents.length - 1 : activeIndex - 1;
    handleSlideChange(prevIndex, 'left');
  }, [activeIndex, agents.length, handleSlideChange]);
  
  const handleNextSlide = useCallback(() => {
    const nextIndex = (activeIndex + 1) % agents.length;
    handleSlideChange(nextIndex, 'right');
  }, [activeIndex, agents.length, handleSlideChange]);
  
  // Auto-rotate slides when not hovering
  useEffect(() => {
    if (isHovering) return;
    
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isHovering, handleNextSlide]);
  
  const handleDotClick = (index: number) => {
    if (index > activeIndex) {
      handleSlideChange(index, 'right');
    } else if (index < activeIndex) {
      handleSlideChange(index, 'left');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDotClick(index);
    }
  };
  
  const handleArrowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextSlide();
    }
  };
  
  const currentAgent = agents[activeIndex];
  
  const handleAgentClick = () => {
    router.push(currentAgent.href);
  };
  
  const handleAgentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(currentAgent.href);
    }
  };
  
  // Calculate transition classes based on direction
  const getTransitionClasses = () => {
    if (!transitioning) return '';
    
    if (direction === 'right') {
      return 'transform translate-x-[-2%] opacity-95';
    } else if (direction === 'left') {
      return 'transform translate-x-[2%] opacity-95';
    }
    return '';
  };
  
  return (
    <div 
      className="relative w-full flex flex-col items-center"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleArrowKeyDown}
      tabIndex={-1}
    >
      {/* Current slide indicator */}
      <div className="absolute -top-10 left-0 flex items-center space-x-2 opacity-70">
        <span className="text-sm font-medium">
          <span className="text-white/80">Agent</span>{' '}
          <span className="text-white font-semibold">{activeIndex + 1}</span>
          <span className="text-white/60">/{agents.length}</span>
        </span>
      </div>
      
      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 z-10 flex items-center">
        <button
          onClick={handlePrevSlide}
          disabled={transitioning}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/40 hover:border-white/20 transition-all duration-300 -ml-2 ${transitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
      </div>
      
      {/* Main Agent Card */}
      <div 
        className={`relative w-full backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg shadow-white/5 hover:shadow-white/10 hover:border-white/20 ${transitioning ? 'scale-[0.99]' : 'scale-100'} ${getTransitionClasses()}`}
        onClick={handleAgentClick}
        onKeyDown={handleAgentKeyDown}
        tabIndex={0}
        aria-label={`Open ${currentAgent.title}`}
      >
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-blue-500/10 to-transparent rounded-xl opacity-50 transition-all duration-500 ${transitioning ? 'scale-105' : 'scale-100'}`} />
        
        {/* Card content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className={`mb-4 w-16 h-16 flex items-center justify-center rounded-xl backdrop-blur-md bg-white/10 border border-white/10 transition-all duration-500 ${transitioning ? 'rotate-12' : 'rotate-0'}`}>
            <Image 
              src={currentAgent.icon} 
              alt={currentAgent.title} 
              width={32} 
              height={32}
              className={`transition-all duration-500 ${transitioning ? 'scale-110' : 'scale-100'}`}
            />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">{currentAgent.title}</h2>
            <p className="text-base opacity-80 mb-4 leading-relaxed">{currentAgent.description}</p>
            
            <div className="inline-flex items-center text-sm font-semibold text-white">
              <span className="mr-2">Explore</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="transition-transform duration-500 transform group-hover:translate-x-1">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-y-0 right-0 z-10 flex items-center">
        <button
          onClick={handleNextSlide}
          disabled={transitioning}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/40 hover:border-white/20 transition-all duration-300 -mr-2 ${transitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
      
      {/* Navigation Dots */}
      <div className="flex space-x-2 mt-6">
        {agents.map((agent, index) => (
          <button
            key={agent.id}
            onClick={() => handleDotClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex === index
                ? 'bg-white w-6'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            tabIndex={0}
            disabled={transitioning}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentSlider; 