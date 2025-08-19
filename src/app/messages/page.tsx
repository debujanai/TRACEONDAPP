'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { 
  messagingService, 
  Message, 
  Conversation, 
  UserProfile as MessagingUserProfile 
} from '@/lib/messaging';
import { useMessaging } from '@/contexts/MessagingContext';

type MessageType = 'all' | 'unread' | 'sent' | 'archived';

export default function Messages() {
  const [activeFilter, setActiveFilter] = useState<MessageType>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessagingUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, connectWallet, userProfile, address } = useWallet();
  const { updateUnreadCount } = useMessaging();

  // Load conversations when user connects
  useEffect(() => {
    if (isConnected && userProfile && address) {
      loadConversations();
      // Set wallet context for RLS
      messagingService.setWalletContext(address);
      // Update global unread count when entering messages page
      updateUnreadCount();
    }
  }, [isConnected, userProfile, address]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (userProfile?.id) {
      messagingService.subscribeToConversations(
        userProfile.id,
        () => {
          // Reload conversations when there's an update
          loadConversations();
          // Update global unread count
          updateUnreadCount();
        }
      );
    }

    return () => {
      messagingService.unsubscribe();
    };
  }, [userProfile?.id]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      
      // Subscribe to real-time messages
      messagingService.subscribeToMessages(
        selectedConversation.id,
        (newMessage) => {
          setConversationMessages(prev => [...prev, newMessage]);
          // Mark messages as read when viewing the conversation
          if (userProfile?.id && newMessage.sender_id !== userProfile.id) {
            messagingService.markMessagesAsRead(selectedConversation.id, userProfile.id);
            // Update global unread count
            updateUnreadCount();
          }
        },
        (updatedMessage) => {
          setConversationMessages(prev => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      );
    }

    return () => {
      messagingService.unsubscribe();
    };
  }, [selectedConversation, userProfile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!userProfile?.id) return;
    
    setIsLoading(true);
    try {
      const userConversations = await messagingService.getUserConversations(userProfile.id);
      setConversations(userConversations);
      // Update global unread count after loading conversations
      updateUnreadCount();
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
    setIsLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const messages = await messagingService.getConversationMessages(conversationId);
      setConversationMessages(messages);
      
      // Mark messages as read
      if (userProfile?.id) {
        await messagingService.markMessagesAsRead(conversationId, userProfile.id);
        // Refresh conversations to update unread count
        loadConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    setIsLoadingMessages(false);
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const users = await messagingService.searchUsersAndWallets(query);
      // Filter out current user
      const filteredUsers = users.filter(user => user.id !== userProfile?.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery]);

  // Filter conversations based on active filter
  const filteredConversations = conversations.filter(conversation => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return conversation.unread_count > 0;
    if (activeFilter === 'sent') return conversation.last_message?.sender_id === userProfile?.id;
    if (activeFilter === 'archived') return false; // No archived conversations for now
    return true;
  }).filter(conversation => 
    conversation.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    (conversation.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userProfile?.id) return;

    try {
      await messagingService.sendMessage(
        selectedConversation.id,
        userProfile.id,
        newMessage
      );
      setNewMessage('');
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getUserAvatar = (user: MessagingUserProfile) => {
    if (user.profile_image) return user.profile_image;
    // Generate avatar based on name
    const initials = user.name.slice(0, 2).toUpperCase();
    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
    const colorIndex = user.name.charCodeAt(0) % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  const startNewConversation = async (user: MessagingUserProfile) => {
    if (!userProfile?.id) return;

    try {
      const conversationId = await messagingService.getOrCreateConversation(
        userProfile.id,
        user.id
      );
      
      if (conversationId) {
        // Find the conversation in our list or create a new one
        let conversation = conversations.find(c => c.id === conversationId);
        
        if (!conversation) {
          // Create a temporary conversation object
          conversation = {
            id: conversationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            participants: [user],
            unread_count: 0,
          };
          setConversations(prev => [conversation!, ...prev]);
        }
        
        setSelectedConversation(conversation);
        setShowNewMessageModal(false);
        setUserSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Background elements */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 10,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Header */}
        <motion.div 
          className="relative z-10 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-block backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-full px-6 py-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-xs uppercase tracking-widest text-white/70">Community Chat</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-['ClashGrotesk-Regular'] mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Messages
          </motion.h1>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Connect and chat with other users in the TraceOn community
          </motion.p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 mb-8 border border-white/10 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Search Bar and New Message Button */}
          <div className="flex gap-4 mb-6">
            <motion.input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              whileFocus={{ scale: 1.01, borderColor: "rgba(255, 255, 255, 0.2)" }}
            />
            <motion.button
              onClick={() => setShowNewMessageModal(true)}
              className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-xl px-6 py-3 text-sm font-medium hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20"></path>
              </svg>
              New Chat
            </motion.button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: `All (${conversations.length})`, count: conversations.length },
              { key: 'unread', label: `Unread (${unreadCount})`, count: unreadCount },
              { key: 'sent', label: 'Sent', count: 0 },
              { key: 'archived', label: 'Archived (0)', count: 0 }
            ].map((filter) => (
              <motion.button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as MessageType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-white/20 text-white'
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Messages Content */}
        {!isConnected ? (
          <motion.div 
            className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-8 border border-white/10 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </motion.div>
            <motion.h3 
              className="text-xl font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Connect Your Wallet
            </motion.h3>
            <motion.p 
              className="text-sm opacity-70 max-w-lg mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Connect your wallet to start chatting with other users in the TraceOn community.
            </motion.p>
            <motion.button
              onClick={connectWallet}
              className="mt-4 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 px-6 py-3 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.97 }}
            >
              Connect Wallet
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
            {/* Conversations List */}
            <motion.div 
              className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl border border-white/10 shadow-lg overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-medium">Conversations</h2>
                {isLoading && (
                  <div className="text-sm text-white/50 mt-1">Loading...</div>
                )}
              </div>
              
              <div className="h-[620px] overflow-y-auto no-scrollbar">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-white/60">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-white/40">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>{isLoading ? 'Loading conversations...' : 'No conversations found'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredConversations.map((conversation, index) => {
                      const otherUser = conversation.participants[0];
                      if (!otherUser) return null;
                      
                      const avatar = getUserAvatar(otherUser);
                      const isPlaceholderUser = otherUser.credits === 0;
                      
                      return (
                        <motion.div
                          key={conversation.id}
                          className={`p-4 hover:bg-white/5 cursor-pointer transition-all ${
                            selectedConversation?.id === conversation.id ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              {typeof avatar === 'object' ? (
                                <div className={`w-12 h-12 ${avatar.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                                  {avatar.initials}
                                </div>
                              ) : (
                                <img src={avatar} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                              )}
                              {isPlaceholderUser && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs">📧</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="text-sm font-medium truncate">{otherUser.name}</p>
                                  {isPlaceholderUser && (
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full whitespace-nowrap">
                                      Not joined
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {conversation.last_message_at && (
                                    <span className="text-xs text-white/50">{formatTimeAgo(conversation.last_message_at)}</span>
                                  )}
                                  {conversation.unread_count > 0 && (
                                    <div className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {conversation.unread_count}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-white/50 truncate">
                                {conversation.last_message ? (
                                  <>
                                    {conversation.last_message.sender_id === userProfile?.id ? 'You: ' : ''}
                                    {conversation.last_message.content}
                                  </>
                                ) : (
                                  isPlaceholderUser 
                                    ? 'Messages will be delivered when they join'
                                    : 'Start a conversation...'
                                )}
                              </p>
                              <p className="text-xs text-white/40 mt-1 truncate">
                                {otherUser.wallet_address}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Chat Area */}
            <motion.div 
              className="lg:col-span-2 backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl border border-white/10 shadow-lg flex flex-col h-[700px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                    <div className="relative">
                      {(() => {
                        const otherUser = selectedConversation.participants[0];
                        if (!otherUser) return null;
                        const avatar = getUserAvatar(otherUser);
                        const isPlaceholderUser = otherUser.credits === 0;
                        return (
                          <>
                            {typeof avatar === 'object' ? (
                              <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                                {avatar.initials}
                              </div>
                            ) : (
                              <img src={avatar} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            {isPlaceholderUser && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-xs">📧</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{selectedConversation.participants[0]?.name}</h3>
                        {selectedConversation.participants[0]?.credits === 0 && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Not on platform
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        {selectedConversation.participants[0]?.wallet_address}
                      </p>
                      {selectedConversation.participants[0]?.credits === 0 && (
                        <p className="text-xs text-orange-400/70 mt-1">
                          Messages will be delivered when they join TraceOn
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages - Fixed height with scroll */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: '530px' }}>
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="text-white/50">Loading messages...</div>
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="text-white/50 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-white/30">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      conversationMessages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          className={`flex ${message.sender_id === userProfile?.id ? 'justify-end' : 'justify-start'}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            message.sender_id === userProfile?.id 
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                              : 'bg-white/10 text-white border border-white/10'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === userProfile?.id ? 'text-white/70' : 'text-white/50'
                            }`}>
                              {formatTimeAgo(message.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/10 flex-shrink-0">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl px-6 py-3 text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: newMessage.trim() ? 1.03 : 1 }}
                        whileTap={{ scale: newMessage.trim() ? 0.97 : 1 }}
                      >
                        Send
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                    <p className="text-sm opacity-70">
                      Choose a conversation to start chatting
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* New Message Modal */}
        <AnimatePresence>
          {showNewMessageModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewMessageModal(false)} />
              <motion.div
                className="relative backdrop-blur-lg bg-gradient-to-b from-black/60 to-black/80 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3 className="text-xl font-medium mb-4">Start New Conversation</h3>
                
                {/* User Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by wallet address or name..."
                    className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                  <p className="text-xs text-white/50 mt-2">
                    💡 You can message any wallet address, even if they haven't joined the platform yet!
                  </p>
                </div>

                {/* Search Results */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {searchResults.length === 0 && userSearchQuery ? (
                    <div className="text-center text-white/60 py-4">
                      {/^0x[a-fA-F0-9]{40}$/.test(userSearchQuery.trim()) ? (
                        <div>
                          <div className="text-purple-400 mb-2">✨ New wallet address detected!</div>
                          <p className="text-sm">Click to start messaging this address</p>
                          <button
                            onClick={async () => {
                              const user = await messagingService.findOrCreateUserByWalletAddress(userSearchQuery.trim());
                              if (user) {
                                await startNewConversation(user);
                              }
                            }}
                            className="mt-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg px-4 py-2 text-sm hover:from-purple-500 hover:to-blue-500 transition-all"
                          >
                            Message {userSearchQuery.slice(0, 6)}...{userSearchQuery.slice(-4)}
                          </button>
                        </div>
                      ) : (
                        'No users found'
                      )}
                    </div>
                  ) : (
                    searchResults.map(user => {
                      const avatar = getUserAvatar(user);
                      const isPlaceholderUser = user.credits === 0;
                      return (
                        <motion.div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                          onClick={() => startNewConversation(user)}
                          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        >
                          <div className="relative">
                            {typeof avatar === 'object' ? (
                              <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                                {avatar.initials}
                              </div>
                            ) : (
                              <img src={avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            {isPlaceholderUser && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-xs">📧</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name}</p>
                              {isPlaceholderUser && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                  Not on platform
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 truncate">{user.wallet_address}</p>
                            {isPlaceholderUser && (
                              <p className="text-xs text-orange-400/70 mt-1">
                                They'll receive messages when they join
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowNewMessageModal(false);
                    setUserSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="mt-4 w-full bg-white/10 rounded-lg px-4 py-2 text-sm hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
} 