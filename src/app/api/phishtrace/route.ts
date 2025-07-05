import { NextRequest, NextResponse } from "next/server";

// VirusTotal API key - should be stored in environment variables
const VIRUS_TOTAL_API_KEY = process.env.VIRUS_TOTAL_API_KEY || 'c5940a71349c4e6d59321ccdc4b0c2ede32687fb787b4e7ff028790236db069e';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Make request to VirusTotal API
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${url}`,
      {
        method: "GET",
        headers: {
          "accept": "application/json",
          "x-apikey": VIRUS_TOTAL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to fetch data from VirusTotal" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error in phishtrace API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
} 