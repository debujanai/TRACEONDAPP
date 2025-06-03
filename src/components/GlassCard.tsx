import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div className={`backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 shadow-lg rounded-xl ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard; 