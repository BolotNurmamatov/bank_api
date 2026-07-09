import os
import requests
import uuid
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_aiyl_accounts():
    """
    Fetches KGS accounts from Aiyl Bank and returns (balance, account_count, status, accounts_list).
    """
    auth_url = os.getenv("ABANK_URL_AUTH")
    username = os.getenv("ABANK_USERNAME")
    password = os.getenv("ABANK_PASSWORD")
    
    # Base URL for balances
    balance_base_url = os.getenv("ABANK_BASE_URL")

    if not all([auth_url, username, password]):
        return 0.0, 0, "Ошибка (Ключи не заданы)", []

    credentials = {"username": username, "password": password}
    try:
        # 1. Auth
        auth_response = requests.post(auth_url, json=credentials, verify=False, timeout=10)
        auth_response.raise_for_status()
        auth_data = auth_response.json()
        access_token = auth_data.get("data", {}).get("access_token")

        if access_token:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Extract accounts from the auth data directly
            # It might be in auth_data["data"]["accounts"] or auth_data["accounts"]
            raw_accounts = auth_data.get("data", {}).get("accounts", []) or auth_data.get("accounts", [])
            accounts_list = []
            
            for acc in raw_accounts:
                if isinstance(acc, dict):
                    acc_num = acc.get("account") or acc.get("accountNumber") or acc.get("number")
                    if acc_num:
                        accounts_list.append(str(acc_num))
                else:
                    accounts_list.append(str(acc))
                    
            # Fallback if no accounts are found in auth response, maybe we can't fetch them
            if not accounts_list:
                print("Warning: No accounts found in Aiyl auth response. auth_data:", auth_data)
            
            valid_accounts = []
            total_balance = 0.0
            now = datetime.now()
            
            # 2. Iterate through each account
            for acc_num in accounts_list:
                url = f"{balance_base_url}?account={acc_num}&currency=KGS"
                try:
                    data_response = requests.get(url, headers=headers, verify=False, timeout=10)
                    data_response.raise_for_status()
                    response_json = data_response.json()
                    
                    if response_json.get("state") == "SUCCESS":
                        bal = float(response_json.get("data", 0.0))
                        valid_accounts.append({
                            "id": str(uuid.uuid4()),
                            "bank_name": "Айыл Банк",
                            "account_number": acc_num,
                            "currency": "KGS",
                            "balance": bal,
                            "last_updated": now
                        })
                        total_balance += bal
                except Exception as req_err:
                    print(f"Error fetching account {acc_num}: {req_err}")
                    
            if valid_accounts:
                return total_balance, len(valid_accounts), "Подключено", valid_accounts
            else:
                return 0.0, 0, "Ошибка (Нет доступных счетов)", []
                
        return 0.0, 0, "Ошибка (Авторизация не удалась)", []
    except Exception as e:
        print(f"Error fetching Aiyl bank data: {e}")
        return 0.0, 0, "Ошибка", []
