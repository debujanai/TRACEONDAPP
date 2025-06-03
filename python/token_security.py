
import tls_client
from fake_useragent import UserAgent
import random
import json
import os
from datetime import datetime

class TokenSecurity:
    def __init__(self):
        self.BASE_URL = "https://gmgn.ai"
        self.randomiseRequest()
        # Create a directory for storing security data
        self.data_dir = "security_data"
        os.makedirs(self.data_dir, exist_ok=True)

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
            "referer": "https://gmgn.ai/?chain=eth",
            "user-agent": self.user_agent,
        }

    def get_token_security_info(self, contract_address: str) -> dict:
        """
        Get comprehensive security information about a token.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Security information including contract analysis and risk factors
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/security/eth/{contract_address}"
        
        try:
            response = self.sendRequest.get(url, headers=self.headers)
            return response.json().get("data", {})
        except Exception as e:
            return {"error": f"Failed to fetch security info: {str(e)}"}

    def get_token_rug_analysis(self, contract_address: str) -> dict:
        """
        Get rug pull analysis and community voting information for a token.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Rug pull risk analysis and community votes
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_link_rug_vote/eth/{contract_address}"
        
        try:
            response = self.sendRequest.get(url, headers=self.headers)
            return response.json()
        except Exception as e:
            return {"error": f"Failed to fetch rug analysis: {str(e)}"}

    def get_token_launch_security(self, contract_address: str) -> dict:
        """
        Get detailed security analysis for token launch parameters.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Launch security metrics and analysis
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/eth/{contract_address}"
        
        try:
            response = self.sendRequest.get(url, headers=self.headers)
            return response.json()
        except Exception as e:
            return {"error": f"Failed to fetch launch security info: {str(e)}"}

    def get_token_statistics(self, contract_address: str) -> dict:
        """
        Get comprehensive token statistics and metrics.
        
        Args:
            contract_address (str): The contract address of the token
            
        Returns:
            dict: Token statistics including trading metrics and market data
        """
        if not contract_address:
            return {"error": "Contract address is required"}
            
        url = f"{self.BASE_URL}/api/v1/token_stat/eth/{contract_address}"
        
        try:
            response = self.sendRequest.get(url, headers=self.headers)
            return response.json()
        except Exception as e:
            return {"error": f"Failed to fetch token statistics: {str(e)}"}

# Main function to run when script is executed
if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print(json.dumps({"error": "Contract address is required"}))
        sys.exit(1)

    contract_address = sys.argv[1]
    token_security = TokenSecurity()
    
    # Gather all data
    security_info = token_security.get_token_security_info(contract_address)
    launch_security = token_security.get_token_launch_security(contract_address)
    rug_analysis = token_security.get_token_rug_analysis(contract_address)
    token_stats = token_security.get_token_statistics(contract_address)
    
    # Combine results
    results = {
        "contractAddress": contract_address,
        "securityInfo": security_info,
        "launchSecurity": launch_security,
        "rugAnalysis": rug_analysis,
        "tokenStats": token_stats
    }
    
    # Output as JSON for the API to parse
    print(json.dumps(results))
