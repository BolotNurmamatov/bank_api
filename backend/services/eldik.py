import os
import requests
import uuid
from datetime import datetime

def fetch_eldik_accounts():
    """
    Fetches KGS accounts from Eldik Bank and returns (balance, account_count, status, accounts_list).
    """
    eldik_base_url = os.getenv("ELDIK_BASE_URL")
    eldik_api_key = os.getenv("ELDIK_API_KEY")
    
    if not eldik_base_url or not eldik_api_key:
        return 0.0, 0, "Ошибка (Ключи не заданы)", []

    eldik_accounts_env = os.getenv("ELDIK_BANK_ACCOUNTS", "")
    allowed_accounts = [acc.strip() for acc in eldik_accounts_env.split(",") if acc.strip()]

    try:
        url = f"{eldik_base_url.rstrip('/')}/api/rko/open-api/all-accounts-balance"
        response = requests.get(url, headers={"apiKey": eldik_api_key}, timeout=15)
        response.raise_for_status()
        accounts_data = response.json()
        
        valid_accounts = []
        total_balance = 0.0
        now = datetime.now()
        
        for acc in accounts_data:
            acc_num = acc.get("taccount", "Unknown")
            
            # Filter by exactly the accounts specified in .env
            if allowed_accounts and acc_num not in allowed_accounts:
                continue

            currency = acc.get("currency", "KGS")
            if currency in ["KGS", "417"]:
                raw_bal = acc.get("accountSaldo") or acc.get("balanceAmount") or acc.get("balance") or 0.0
                bal = float(raw_bal)
                
                valid_accounts.append({
                    "id": str(uuid.uuid4()),
                    "bank_name": "Элдик Банк",
                    "account_number": acc_num,
                    "currency": "KGS",
                    "balance": bal,
                    "last_updated": now
                })
                total_balance += bal
                
        return total_balance, len(valid_accounts), "Подключено", valid_accounts
        
    except Exception as e:
        print(f"Error fetching Eldik bank data: {e}")
        return 0.0, 0, "Ошибка", []
