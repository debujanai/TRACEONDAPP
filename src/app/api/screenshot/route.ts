import { NextResponse } from 'next/server';

interface MicrolinkResponse {
  status: string;
  data: {
    screenshot: {
      url: string;
      width: number;
      height: number;
      type: string;
      size: number;
      size_pretty: string;
    }
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Call Microlink API to generate screenshot
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
    
    const response = await fetch(microlinkUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate screenshot');
    }

    const data = await response.json() as MicrolinkResponse;
    
    if (data.status !== 'success' || !data.data.screenshot) {
      throw new Error('Failed to generate screenshot');
    }

    return NextResponse.json({
      screenshot: data.data.screenshot
    });
  } catch (error) {
    console.error('Screenshot generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate screenshot' },
      { status: 500 }
    );
  }
} 