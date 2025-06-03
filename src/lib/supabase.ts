'use client';

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are available and log warning if not
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Check your .env.local file.');
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => fetch(...args)
  },
  db: {
    schema: 'public',
  }
});

// Debug connection on client side
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').single();
      if (error) {
        console.error('Supabase connection check failed:', error.message);
      } else {
        console.log('Supabase connection successful');
      }
    } catch (err) {
      console.error('Supabase connection error:', err);
    }
  })();
}

export type UserProfile = {
  id: string;
  wallet_address: string;
  name: string;
  created_at: string;
  credits: number;
  profile_image?: string;
};

export type SearchHistoryItem = {
  id: string;
  user_id: string;
  search_query: string;
  created_at: string;
  contract_address?: string;
  search_type?: string;
};

// Create or get a user profile by wallet address
export const getOrCreateProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  try {
    if (!walletAddress) {
      console.error('Wallet address is required');
      return null;
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // First try to get the existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();
      
    // If profile exists, return it
    if (existingProfile) {
      console.log('Found existing profile:', existingProfile);
      return existingProfile as UserProfile;
    }
    
    // If no profile exists, create a new one
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('No profile found, creating new one for address:', normalizedAddress);
      
      const newProfile = {
        wallet_address: normalizedAddress,
        name: 'User', // Default name
        created_at: new Date().toISOString(),
        credits: 100 // Default credits
      };
      
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }
      
      console.log('Created new profile:', insertedProfile);
      return insertedProfile as UserProfile;
    }
    
    console.error('Error fetching profile:', fetchError);
    return null;
  } catch (error) {
    console.error('Error in getOrCreateProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  walletAddress: string, 
  name: string, 
  imageUrl?: string
): Promise<UserProfile | null> => {
  try {
    if (!walletAddress) {
      console.error('Wallet address is required');
      return null;
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // First get the profile to ensure it exists
    const profile = await getOrCreateProfile(normalizedAddress);
    if (!profile) {
      console.error('Could not get or create profile');
      return null;
    }
    
    // Prepare update data
    const updateData: Partial<UserProfile> = { name };
    
    if (imageUrl) {
      // Process the imageUrl to ensure it has the gateway prefix if it's an IPFS hash
      const processedImageUrl = await uploadImageToStorage(imageUrl, normalizedAddress);
      if (processedImageUrl) {
        updateData.profile_image = processedImageUrl;
      }
    }
    
    console.log('Updating profile with data:', updateData);
    
    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('wallet_address', normalizedAddress)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    
    console.log('Profile updated successfully:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Get user search history (all records for stats)
export const getUserSearchHistory = async (userId: string): Promise<SearchHistoryItem[]> => {
  try {
    if (!userId) {
      console.error('User ID is required for search history');
      return [];
    }
    
    console.log('Fetching all search history for user:', userId);
    
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} search history items`);
    return data as SearchHistoryItem[];
  } catch (error) {
    console.error('Error in getUserSearchHistory:', error);
    return [];
  }
};

// Get recent search history (limited to 10 most recent)
export const getRecentSearchHistory = async (userId: string): Promise<SearchHistoryItem[]> => {
  try {
    if (!userId) {
      console.error('User ID is required for search history');
      return [];
    }
    
    console.log('Fetching recent search history for user:', userId);
    
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching recent search history:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} recent search history items`);
    return data as SearchHistoryItem[];
  } catch (error) {
    console.error('Error in getRecentSearchHistory:', error);
    return [];
  }
};

// Clear all search history for a user
export const clearUserSearchHistory = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      console.error('User ID is required to clear history');
      return false;
    }
    
    console.log('Clearing search history for user:', userId);
    
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
    
    console.log('Search history cleared successfully');
    return true;
  } catch (error) {
    console.error('Error in clearUserSearchHistory:', error);
    return false;
  }
};

// Add a search to history
export const addSearchToHistory = async (
  userId: string,
  searchQuery: string,
  contractAddress?: string,
  searchType?: string
): Promise<boolean> => {
  try {
    if (!userId || !searchQuery) {
      console.error('User ID and search query are required', { userId, searchQuery });
      return false;
    }
    
    console.log('Adding search to history:', {
      userId,
      searchQuery,
      contractAddress,
      searchType
    });
    
    // Create record to insert
    const record = {
      user_id: userId,
      search_query: searchQuery,
      contract_address: contractAddress,
      search_type: searchType,
      created_at: new Date().toISOString() // Explicitly set timestamp for consistency
    };
    
    console.log('Inserting record into search_history:', record);
    
    const { data, error } = await supabase
      .from('search_history')
      .insert(record)
      .select(); // Return the inserted data
      
    if (error) {
      console.error('Error adding search to history:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return false;
    }
    
    console.log('Search added to history successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in addSearchToHistory:', error);
    return false;
  }
};

// Upload image to Supabase Storage
export const uploadImageToStorage = async (file: File | string, walletAddress: string): Promise<string | null> => {
  try {
    if (!file || !walletAddress) {
      console.error('File and wallet address are required');
      return null;
    }
    
    // Check if the file is actually an IPFS hash string
    if (typeof file === 'string') {
      // Handle IPFS URL or hash
      const ipfsHash = file.startsWith('https://gateway.pinata.cloud/ipfs/') 
        ? file.replace('https://gateway.pinata.cloud/ipfs/', '')
        : file;
      
      // Return the full gateway URL
      const fullUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      console.log('Using IPFS URL:', fullUrl);
      return fullUrl;
    }
    
    console.log('Uploading to Supabase Storage for address:', walletAddress);
    
    // Generate unique file path
    const timestamp = Date.now();
    const cleanedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${walletAddress.toLowerCase()}-${timestamp}-${cleanedName}`;
    
    console.log('Uploading file to path:', filePath);
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading to Storage:', error);
      return null;
    }
    
    console.log('Upload successful, getting public URL');
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('user-uploads')
      .getPublicUrl(data.path);
    
    console.log('Storage public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    return null;
  }
};

// Get trending contract addresses from search history
export const getTrendingSearches = async (limit = 6): Promise<{address: string, count: number}[]> => {
  try {
    console.log('Fetching contract addresses from audit history...');
    
    // Get all recent search history
    const { data: searchData, error: searchError } = await supabase
      .from('search_history')
      .select('contract_address, search_type')
      .not('contract_address', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500); // Get more data to analyze frequency
    
    if (searchError || !searchData || searchData.length === 0) {
      console.error('Error fetching search history:', searchError);
      return [];
    }
    
    console.log(`Found ${searchData.length} search history entries`);
    
    // Count frequency of each contract address
    const addressCounts: Record<string, number> = {};
    
    searchData.forEach(item => {
      if (item.contract_address) {
        // Prioritize contract_audit searches with higher weight
        const weight = item.search_type === 'contract_audit' ? 2 : 1;
        
        if (addressCounts[item.contract_address]) {
          addressCounts[item.contract_address] += weight;
        } else {
          addressCounts[item.contract_address] = weight;
        }
      }
    });
    
    // Convert to array, sort by count (frequency) in descending order
    const sortedAddresses = Object.entries(addressCounts)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    console.log('Sorted addresses by frequency:', sortedAddresses);
    return sortedAddresses;
    
  } catch (error) {
    console.error('Error in getTrendingSearches:', error);
    return [];
  }
};

// Get top profiles (profiles with most credits/activity)
export const getTopProfiles = async (limit = 4): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('credits', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching top profiles:', error);
      return [];
    }
    
    return data as UserProfile[];
  } catch (error) {
    console.error('Error in getTopProfiles:', error);
    return [];
  }
};

// Add a new search history entry
export const addSearchHistory = async (
  userId: string, 
  query: string, 
  contractAddress?: string, 
  searchType?: string
): Promise<boolean> => {
  try {
    if (!userId || !query) {
      console.error('User ID and query are required');
      return false;
    }
    
    console.log('Adding search history for user:', userId, 'query:', query);
    
    const newSearchEntry = {
      user_id: userId,
      search_query: query,
      created_at: new Date().toISOString(),
      contract_address: contractAddress,
      search_type: searchType || 'general'
    };
    
    const { error } = await supabase
      .from('search_history')
      .insert(newSearchEntry);
      
    if (error) {
      console.error('Error adding search history:', error);
      return false;
    }
    
    console.log('Search history added successfully');
    return true;
  } catch (error) {
    console.error('Error in addSearchHistory:', error);
    return false;
  }
}; 