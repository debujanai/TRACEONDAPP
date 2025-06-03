'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import GlassCard from '@/components/GlassCard';
import { uploadImageToStorage } from '@/lib/supabase';
import { uploadImageToPinata } from '@/lib/pinata';
import { useWallet } from '@/contexts/WalletContext';
import Image from 'next/image';

export default function SettingsPage() {
  const { userProfile, address, updateUserProfile } = useWallet();
  const [name, setName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      console.log("User profile image URL:", userProfile.profile_image);
      setImageUrl(userProfile.profile_image || '');
    }

    // Debug environment variables
    console.log("Environment variables check:");
    console.log("PINATA_API_KEY exists:", !!process.env.NEXT_PUBLIC_PINATA_API_KEY);
    console.log("PINATA_API_SECRET exists:", !!process.env.NEXT_PUBLIC_PINATA_API_SECRET);
    console.log("SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, [userProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = async () => {
    if (!address) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      let finalImageUrl = userProfile?.profile_image;
      
      // Upload image to Pinata if a new one was selected
      if (imageFile) {
        try {
          // Try Pinata first
          finalImageUrl = await uploadImageToPinata(imageFile);
          console.log("Pinata upload successful:", finalImageUrl);
        } catch (pinataError) {
          console.error("Pinata upload failed, trying Supabase Storage instead:", pinataError);
          
          // Fallback to Supabase Storage
          if (address) {
            const storageUrl = await uploadImageToStorage(imageFile, address);
            if (storageUrl) {
              finalImageUrl = storageUrl;
              console.log("Supabase Storage upload successful:", finalImageUrl);
            } else {
              throw new Error("Failed to upload image to both Pinata and Supabase");
            }
          }
        }
      } else if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
        // If we have a non-URL string (like just an IPFS hash), convert it to a proper URL
        const convertedUrl = await uploadImageToStorage(imageUrl, address);
        if (convertedUrl) {
          finalImageUrl = convertedUrl;
          console.log("Converted IPFS hash to full URL:", finalImageUrl);
        }
      }
      
      // Update profile using the context function which handles everything
      if (updateUserProfile) {
        await updateUserProfile(name, finalImageUrl);
        
        // Update local state with new image URL
        setImageUrl(finalImageUrl || '');
        
        console.log("Profile updated successfully with image:", finalImageUrl);
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get initials from name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Image failed to load:", e.currentTarget.src);
    e.currentTarget.src = ''; // Clear the src to show initials instead
    setImageUrl(''); // Update state to trigger re-render with initials
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm opacity-70">Customize your AuditAI experience</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded mb-6">
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GlassCard className="p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Profile Settings</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                  <div 
                    className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-blue-400 flex items-center justify-center text-white font-bold text-2xl cursor-pointer group"
                    onClick={handleImageClick}
                  >
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        width={96}
                        height={96}
                        onError={handleImageError}
                        unoptimized={true}
                      />
                    ) : (
                      <span>{userProfile?.name ? getInitials(userProfile.name) : 'User'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">Change</span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Profile Picture</p>
                    <p className="text-xs opacity-70">Upload a profile picture or avatar</p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 dark:bg-black/20 border border-white/10 focus:outline-none focus:border-purple-500/50" 
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Wallet Address</label>
                  <input 
                    type="text" 
                    id="walletAddress" 
                    value={address || ''}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-white/5 dark:bg-black/20 border border-white/10 opacity-70" 
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </GlassCard>
          </div>
          
          <div>
            <GlassCard className="p-6 mb-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-gradient-to-tr from-purple-600 to-blue-400 flex items-center justify-center text-white font-bold text-2xl">
                  {imageUrl ? (
                    <Image 
                      src={imageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                      onError={handleImageError}
                      unoptimized={true}
                    />
                  ) : (
                    <span>{userProfile?.name ? getInitials(userProfile.name) : 'U'}</span>
                  )}
                </div>
                <h2 className="font-bold mt-3">{userProfile?.name || 'User'}</h2>
                <p className="text-sm opacity-70">Premium Plan</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Audits Used</span>
                  <span className="text-sm font-medium">{userProfile ? userProfile.credits : 0} / 150</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full" 
                    style={{width: `${userProfile ? (userProfile.credits / 150) * 100 : 0}%`}}
                  ></div>
                </div>
              </div>
              
              <button className="w-full px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors mb-2">
                Upgrade Plan
              </button>
              <button className="w-full px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                Billing History
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 