'use client';

import axios from 'axios';

// Function to upload image to Pinata
export const uploadImageToPinata = async (file: File): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials are not configured');
  }
  
  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Create form data
  const formData = new FormData();
  formData.append('file', new Blob([buffer]), file.name);
  
  // Add metadata
  const metadata = JSON.stringify({
    name: `token-logo-${Date.now()}`,
    keyvalues: {
      uploadDate: new Date().toISOString(),
      contentType: file.type,
    }
  });
  formData.append('pinataMetadata', metadata);
  
  // Add options
  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);
  
  // Upload to Pinata
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Content-Type': `multipart/form-data;`,
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
    }
  );
  
  if (!response.data.IpfsHash) {
    throw new Error('Failed to upload to IPFS: No hash returned');
  }
  
  // Return the full gateway URL instead of just the hash
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  console.log('Pinata upload successful, full URL:', gatewayUrl);
  return gatewayUrl;
}; 