import axios from 'axios';

// Server-side function to upload to Pinata
export const uploadToPinataServer = async (file: File): Promise<string> => {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials are not configured on the server');
  }
  
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  const metadata = JSON.stringify({
    name: `token-logo-${Date.now()}`,
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
        'Content-Type': 'multipart/form-data',
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  
  return response.data.IpfsHash;
}; 