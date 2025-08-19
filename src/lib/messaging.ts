import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  updated_at: string;
  is_read: boolean;
  metadata?: any;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants: UserProfile[];
  last_message?: Message;
  unread_count: number;
}

export interface UserProfile {
  id: string;
  wallet_address: string;
  name: string;
  profile_image?: string;
  created_at: string;
  credits: number;
}

class MessagingService {
  private messageSubscription: RealtimeChannel | null = null;
  private conversationSubscription: RealtimeChannel | null = null;

  // Set wallet address context for RLS (simplified for now)
  async setWalletContext(walletAddress: string) {
    // For now, we'll skip the RLS context since we're using simplified policies
    console.log('Setting wallet context for:', walletAddress);
  }

  // Get all conversations for the current user
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          last_message_at,
          conversation_participants!inner (
            user_id,
            profiles (
              id,
              wallet_address,
              name,
              profile_image,
              created_at,
              credits
            )
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      if (!conversations) return [];

      // Process conversations to get participants and last messages
      const processedConversations = await Promise.all(
        conversations.map(async (conv: any) => {
          // Get all participants except current user
          const { data: allParticipants } = await supabase
            .from('conversation_participants')
            .select(`
              profiles (
                id,
                wallet_address,
                name,
                profile_image,
                created_at,
                credits
              )
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', userId);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                wallet_address,
                name,
                profile_image
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          return {
            id: conv.id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message_at: conv.last_message_at,
            participants: allParticipants?.map((p: any) => p.profiles) || [],
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      return processedConversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            wallet_address,
            name,
            profile_image
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<Message | null> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
        })
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            wallet_address,
            name,
            profile_image
          )
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  // Get or create conversation between two users (updated to use regular queries)
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      console.log('Looking for conversation between users:', user1Id, user2Id);

      // First, try to find existing conversation between these two users
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            created_at
          )
        `)
        .eq('user_id', user1Id);

      if (searchError) {
        console.error('Error searching for conversations:', searchError);
        return null;
      }

      // Check if any of these conversations also include user2
      for (const conv of existingConversations || []) {
        const { data: participantCheck } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .eq('user_id', user2Id);

        if (participantCheck && participantCheck.length > 0) {
          // Found existing conversation
          console.log('Found existing conversation:', conv.conversation_id);
          return conv.conversation_id;
        }
      }

      // No existing conversation found, create new one
      console.log('Creating new conversation...');
      
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return null;
      }

      console.log('Created conversation:', newConversation.id);

      // Add both users as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user1Id },
          { conversation_id: newConversation.id, user_id: user2Id }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return null;
      }

      console.log('Added participants to conversation');
      return newConversation.id;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }

  // Find users by wallet address
  async findUsersByWalletAddress(query: string): Promise<UserProfile[]> {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`wallet_address.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return users || [];
    } catch (error) {
      console.error('Error in findUsersByWalletAddress:', error);
      return [];
    }
  }

  // Create placeholder profile for non-platform users
  async createPlaceholderProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single();
        
      if (existingProfile) {
        return existingProfile as UserProfile;
      }
      
      // Create placeholder profile
      const placeholderProfile = {
        wallet_address: normalizedAddress,
        name: `User (${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)})`,
        created_at: new Date().toISOString(),
        credits: 0 // Placeholder users get 0 credits until they join
      };
      
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(placeholderProfile)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating placeholder profile:', error);
        return null;
      }
      
      console.log('Created placeholder profile for:', normalizedAddress);
      return newProfile as UserProfile;
    } catch (error) {
      console.error('Error in createPlaceholderProfile:', error);
      return null;
    }
  }

  // Find or create user by wallet address (supports messaging to non-platform users)
  async findOrCreateUserByWalletAddress(walletAddress: string): Promise<UserProfile | null> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // First try to find existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single();
        
      if (existingUser) {
        return existingUser as UserProfile;
      }
      
      // If no user found, create placeholder profile
      return await this.createPlaceholderProfile(normalizedAddress);
    } catch (error) {
      console.error('Error in findOrCreateUserByWalletAddress:', error);
      return null;
    }
  }

  // Enhanced search that includes exact wallet address matching
  async searchUsersAndWallets(query: string): Promise<UserProfile[]> {
    try {
      // First, search existing users
      const existingUsers = await this.findUsersByWalletAddress(query);
      
      // Check if query looks like a wallet address (starts with 0x and is 42 chars)
      const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(query.trim());
      
      if (isWalletAddress) {
        const normalizedAddress = query.trim().toLowerCase();
        
        // Check if this exact wallet address is already in results
        const alreadyFound = existingUsers.some(user => 
          user.wallet_address.toLowerCase() === normalizedAddress
        );
        
        if (!alreadyFound) {
          // Try to create/find placeholder profile for this address
          const placeholderUser = await this.findOrCreateUserByWalletAddress(normalizedAddress);
          if (placeholderUser) {
            return [placeholderUser, ...existingUsers];
          }
        }
      }
      
      return existingUsers;
    } catch (error) {
      console.error('Error in searchUsersAndWallets:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return false;
    }
  }

  // Subscribe to new messages in real-time
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void
  ): void {
    this.messageSubscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                wallet_address,
                name,
                profile_image
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onNewMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete updated message with sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                wallet_address,
                name,
                profile_image
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onMessageUpdate(message);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to conversation updates
  subscribeToConversations(
    userId: string,
    onConversationUpdate: (conversation: any) => void
  ): void {
    this.conversationSubscription = supabase
      .channel(`user_conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          onConversationUpdate(payload);
        }
      )
      .subscribe();
  }

  // Unsubscribe from all real-time channels
  unsubscribe(): void {
    if (this.messageSubscription) {
      supabase.removeChannel(this.messageSubscription);
      this.messageSubscription = null;
    }
    if (this.conversationSubscription) {
      supabase.removeChannel(this.conversationSubscription);
      this.conversationSubscription = null;
    }
  }

  // Get online users (you can implement presence later)
  async getOnlineUsers(): Promise<UserProfile[]> {
    // For now, return empty array. You can implement presence tracking later
    return [];
  }
}

export const messagingService = new MessagingService(); 