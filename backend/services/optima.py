import os
import requests
import uuid
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_optima_accounts():
    """
    Fetches KGS accounts from Optima Bank and returns (balance, account_count, status, accounts_list).
    """
    optima_base_url = os.getenv("OPTIMA_BASE_URL")
    optima_api_key = os.getenv("OPTIMA_API_KEY")
    optima_legal_party_id = os.getenv("OPTIMA_LEGAL_PARTY_ID", "373384")
    
    if not optima_base_url or not optima_api_key:
        return 0.0, 0, "Ошибка (Ключи не заданы)", []

    try:
        url = f"{optima_base_url.rstrip('/')}/api/v1/get-account-infos-by-filter"
        headers = {"X-API-KEY": optima_api_key, "Accept": "application/json"}
        params = {"currencyIsoCodes": "KGS", "legalPartyId": optima_legal_party_id}
        
        response = requests.get(url, params=params, headers=headers, verify=False, timeout=15)
        response.raise_for_status()
        accounts_data = response.json()
        
        valid_accounts = []
        total_balance = 0.0
        now = datetime.now()
        
        # Depending on Optima response format, we assume it's a list or has a data wrapper.
        # usually accounts_data might be a list or a dict containing 'data' or 'accounts'
        # Adjust parsing if necessary based on real payload structure.
        accounts_list = accounts_data if isinstance(accounts_data, list) else accounts_data.get("data", [])
        if not accounts_list and isinstance(accounts_data, dict):
             accounts_list = accounts_data.get("accounts", [])
             
        for acc in accounts_list:
            acc_num = acc.get("accountNumber") or acc.get("taccount") or "Unknown"
            bal = float(acc.get("balance") or acc.get("balanceAmount") or 0.0)
            currency = acc.get("currencyIsoCode") or acc.get("currency") or "KGS"
            
            if currency in ["KGS", "417"]:
                valid_accounts.append({
                    "id": str(uuid.uuid4()),
                    "bank_name": "Оптима Банк",
                    "account_number": acc_num,
                    "currency": "KGS",
                    "balance": bal,
                    "last_updated": now
                })
                total_balance += bal
                
        return total_balance, len(valid_accounts), "Подключено", valid_accounts
        
    except Exception as e:
        print(f"Error fetching Optima bank data: {e}")
        return 0.0, 0, "Ошибка", []
