import { NextRequest, NextResponse } from "next/server";
import dns from 'dns';
import tls from 'tls';
import { URL } from 'url';
import https from 'https';
import { TLSSocket } from 'tls';

// Helper function to get domain from URL
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.hostname;
  } catch (error) {
    console.error("Error extracting domain:", error);
    return urlString;
  }
}

// Helper function to fetch domain info using WhoisXML API
async function fetchDomainInfo(domain: string) {
  try {
    const apiKey = process.env.WHOISXML_API_KEY;
    
    if (!apiKey) {
      console.error("WhoisXML API key is missing");
      return { error: "API configuration error" };
    }
    
    console.log(`Fetching domain info for: ${domain}`);
    const apiUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error("WhoisXML API error:", response.status, await response.text());
      return { error: "Could not fetch domain registration data" };
    }
    
    const data = await response.json();
    console.log("WhoisXML API response received");
    
    if (!data.WhoisRecord) {
      console.error("No WhoisRecord in response:", JSON.stringify(data));
      return { error: "No domain data returned" };
    }
    
    // Extract the relevant information
    const record = data.WhoisRecord;
    
    // Handle different response formats - check all possible paths for dates
    let creationDate = null;
    if (record.createdDate) {
      creationDate = record.createdDate;
    } else if (record.registryData?.createdDate) {
      creationDate = record.registryData.createdDate;
    } else if (record.createdDateNormalized) {
      creationDate = record.createdDateNormalized;
    } else if (record.registryData?.createdDateNormalized) {
      creationDate = record.registryData.createdDateNormalized;
    } else if (record.created) {
      creationDate = record.created;
    } else if (record.registryData?.created) {
      creationDate = record.registryData.created;
    }
    
    let expirationDate = null;
    if (record.expiresDate) {
      expirationDate = record.expiresDate;
    } else if (record.registryData?.expiresDate) {
      expirationDate = record.registryData.expiresDate;
    } else if (record.expiresDateNormalized) {
      expirationDate = record.expiresDateNormalized;
    } else if (record.registryData?.expiresDateNormalized) {
      expirationDate = record.registryData.expiresDateNormalized;
    } else if (record.expires) {
      expirationDate = record.expires;
    } else if (record.registryData?.expires) {
      expirationDate = record.registryData.expires;
    }
    
    let updatedDate = null;
    if (record.updatedDate) {
      updatedDate = record.updatedDate;
    } else if (record.registryData?.updatedDate) {
      updatedDate = record.registryData.updatedDate;
    } else if (record.updatedDateNormalized) {
      updatedDate = record.updatedDateNormalized;
    } else if (record.registryData?.updatedDateNormalized) {
      updatedDate = record.registryData.updatedDateNormalized;
    } else if (record.updated) {
      updatedDate = record.updated;
    } else if (record.registryData?.updated) {
      updatedDate = record.registryData.updated;
    }
    
    // Get registrar information
    let registrar = 'Unknown';
    if (record.registrarName) {
      registrar = record.registrarName;
    } else if (record.registryData?.registrarName) {
      registrar = record.registryData.registrarName;
    } else if (record.registrar) {
      registrar = record.registrar;
    } else if (record.registryData?.registrar) {
      registrar = record.registryData.registrar;
    }
    
    // Calculate domain age in days if creation date is available
    let domainAge = null;
    if (creationDate) {
      try {
        domainAge = Math.floor((Date.now() - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24));
      } catch (e) {
        console.error("Error calculating domain age:", e);
      }
    }
    
    const registrationInfo = {
      creationDate,
      expirationDate,
      lastUpdated: updatedDate,
      registrar,
      domainAge
    };
    
    console.log("Domain info extracted successfully:", JSON.stringify(registrationInfo));
    return registrationInfo;
  } catch (error) {
    console.error("Error fetching domain info:", error);
    return { error: "Failed to fetch domain registration information" };
  }
}

// Helper function to get SSL certificate info
function getSSLCertificateInfo(hostname: string): Promise<any> {
  return new Promise((resolve) => {
    try {
      const options = {
        host: hostname,
        port: 443,
        method: 'GET',
        path: '/',
        rejectUnauthorized: false, // Allow self-signed certificates
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        const socket = res.socket as TLSSocket;
        const cert = socket.getPeerCertificate();
        
        if (Object.keys(cert).length === 0) {
          resolve({ error: "No SSL certificate found" });
          return;
        }
        
        // Calculate validity period
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const isValid = now >= validFrom && now <= validTo;
        
        // Calculate days until expiration
        const daysToExpiration = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Certificate age in days
        const certAge = Math.floor((now.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24));
        
        const certInfo = {
          issuer: cert.issuer,
          subject: cert.subject,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          isValid: isValid,
          daysToExpiration: daysToExpiration,
          certAge: certAge,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber
        };
        
        resolve(certInfo);
        req.end();
      });
      
      req.on('error', (err) => {
        console.error("Error getting SSL certificate:", err);
        resolve({ error: "Failed to fetch SSL certificate information" });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: "Request timed out while fetching SSL certificate" });
      });
      
      req.end();
      
    } catch (error) {
      console.error("Error in SSL certificate check:", error);
      resolve({ error: "Failed to check SSL certificate" });
    }
  });
}

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

    const domain = extractDomain(url);
    console.log(`Processing domain info request for: ${domain}`);
    
    // Fetch domain registration info and SSL certificate info in parallel
    try {
      const [domainInfo, sslInfo] = await Promise.all([
        fetchDomainInfo(domain),
        getSSLCertificateInfo(domain)
      ]);

      console.log(`Domain info API request completed for ${domain}`);
      
      return NextResponse.json({
        domain,
        domainInfo,
        sslInfo
      });
    } catch (fetchError: unknown) {
      console.error(`Error fetching domain or SSL info for ${domain}:`, fetchError);
      return NextResponse.json(
        { 
          error: "Failed to fetch domain or SSL information", 
          details: fetchError instanceof Error ? fetchError.message : String(fetchError) 
        },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error("Error in domain-info API route:", error);
    return NextResponse.json(
      { 
        error: "An error occurred while processing the request", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 