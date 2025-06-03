import { useEffect } from 'react';

/**
 * CustomScrollbar - Adds custom scrollbar styling to the application
 * Import this component once in your layout or page to apply the styling globally
 */
export default function CustomScrollbar() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, rgba(139, 92, 246, 0.5), rgba(59, 130, 246, 0.5));
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, rgba(139, 92, 246, 0.7), rgba(59, 130, 246, 0.7));
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(to bottom, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8));
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(139, 92, 246, 0.5) rgba(0, 0, 0, 0.1);
      }
      .no-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null; // This component doesn't render anything visible
} 