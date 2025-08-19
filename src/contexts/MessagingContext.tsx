'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { messagingService } from '@/lib/messaging';

interface MessagingContextType {
  unreadCount: number;
  updateUnreadCount: () => void;
  markAllAsRead: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider = ({ children }: MessagingProviderProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile, isConnected, address } = useWallet();

  const updateUnreadCount = async () => {
    if (!userProfile?.id || !isConnected) {
      setUnreadCount(0);
      return;
    }

    try {
      const conversations = await messagingService.getUserConversations(userProfile.id);
      const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  // Update unread count when user connects or changes
  useEffect(() => {
    if (isConnected && userProfile && address) {
      updateUnreadCount();
      messagingService.setWalletContext(address);
    } else {
      setUnreadCount(0);
    }
  }, [isConnected, userProfile, address]);

  // Subscribe to new messages globally
  useEffect(() => {
    if (!userProfile?.id) return;

    // Subscribe to all conversation updates to track unread counts
    messagingService.subscribeToConversations(
      userProfile.id,
      () => {
        // When any conversation updates, refresh unread count
        updateUnreadCount();
      }
    );

    return () => {
      messagingService.unsubscribe();
    };
  }, [userProfile?.id]);

  // Poll for updates every 30 seconds as backup
  useEffect(() => {
    if (!isConnected || !userProfile) return;

    const interval = setInterval(updateUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isConnected, userProfile]);

  const value = {
    unreadCount,
    updateUnreadCount,
    markAllAsRead,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}; 