#!/usr/bin/env python
import tls_client
from fake_useragent import UserAgent
import random
import json
import os
import sys
import time
from datetime import datetime

class SolanaTokenSecurity:
    def __init__(self):
        self.BASE_URL = "https://gmgn.ai"
        self.randomiseRequest()
        # Create a directory for storing security data
        self.data_dir = "security_data"
        os.makedirs(self.data_dir, exist_ok=True)
        self.MAX_RETRIES = 3
        self.RETRY_DELAY = 2  # seconds

    def randomiseRequest(self):
        """Initialize request settings with random user agent and headers"""
        self.identifier = random.choice(
            [
                browser
                for browser in tls_client.settings.ClientIdentifiers.__args__
                if browser.startswith(("chrome", "safari", "firefox", "opera"))
            ]
        )
        
        self.sendRequest = tls_client.Session(
            random_tls_extension_order=True,
            client_identifier=self.identifier
        )
        self.sendRequest.timeout_seconds = 60

        try:
            self.user_agent = UserAgent(os=["Windows"]).random
        except Exception:
            self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:82.0) Gecko/20100101 Firefox/82.0"

        self.headers = {
            "Host": "gmgn.ai",
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "dnt": "1",
            "priority": "u=1, i",
            "referer": "https://gmgn.ai/?chain=sol",
            "user-agent": self.user_agent,
        }
    
    def make_request_with_retry(self, url, headers=None):
        """
        Make an HTTP request with retry logic
        
        Args:
            url (str): The URL to request
            headers (dict, optional): The request headers. If None, use self.headers
            
        Returns:
            dict: The JSON response or error information
        """
        if headers is None:
            headers = self.headers
            
        errors = []
        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.sendRequest.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                
                errors.append(f"Attempt {attempt+1}: HTTP status code {response.status_code}")
                
            except Exception as e:
                errors.append(f"Attempt {attempt+1}: {str(e)}")
            
            # If not the last attempt, wait before retrying
            if attempt < self.MAX_RETRIES - 1:
                time.sleep(self.RETRY_DELAY)
                # Randomize the user agent for the next attempt
                try:
                    headers["user-agent"] = UserAgent(os=["Windows"]).random
                except Exception:
                    pass
        
        # If we get here, all retries failed
        return {"error": f"Failed after {self.MAX_RETRIES} attempts. Errors: {'; '.join(errors)}"}

    def get_token_rug_analysis(self, contract_address: str) -> dict:
        """
        Get rug pull analysis and community voting information for a Solana token.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Rug pull risk analysis and community votes
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_link_rug_vote/sol/{contract_address}"
        return self.make_request_with_retry(url)

    def get_token_launch_security(self, contract_address: str) -> dict:
        """
        Get detailed security analysis for Solana token launch parameters.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Launch security metrics and analysis
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/sol/{contract_address}"
        return self.make_request_with_retry(url)

    def get_token_statistics(self, contract_address: str) -> dict:
        """
        Get comprehensive Solana token statistics and metrics.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Token statistics including trading metrics and market data
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/token_stat/sol/{contract_address}"
        return self.make_request_with_retry(url)

    def get_top_traders(self, contract_address: str) -> dict:
        """
        Get information about the top traders for a specific Solana token.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Top traders data for the token
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/top_traders/sol/{contract_address}"
        return self.make_request_with_retry(url)


if __name__ == "__main__":
    # Command-line functionality
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python solana_token_security.py <method> <contract_address>"}))
        sys.exit(1)
    
    method = sys.argv[1]
    contract_address = sys.argv[2]
    
    token_security = SolanaTokenSecurity()
    
    try:
        if method == "security_info":
            # Security info is now handled by the GoPlus API route
            result = {"error": "Security info is now handled by the GoPlus API route"}
        elif method == "rug_analysis":
            result = token_security.get_token_rug_analysis(contract_address)
        elif method == "launch_security":
            result = token_security.get_token_launch_security(contract_address)
        elif method == "token_stats":
            result = token_security.get_token_statistics(contract_address)
        elif method == "top_traders":
            result = token_security.get_top_traders(contract_address)
        else:
            result = {"error": f"Unknown method: {method}"}
        
        # Output the result as JSON to be captured by the Node.js process
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Error executing method {method}: {str(e)}"}))
        sys.exit(1) 