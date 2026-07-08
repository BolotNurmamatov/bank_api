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
    data_url = os.getenv("DATA_URL")
    username = os.getenv("ABANK_USERNAME")
    password = os.getenv("ABANK_PASSWORD")

    if not all([auth_url, username, password, data_url]):
        return 0.0, 0, "Ошибка (Ключи не заданы)", []

    credentials = {"username": username, "password": password}
    try:
        # 1. Auth
        auth_response = requests.post(auth_url, json=credentials, verify=False, timeout=10)
        auth_response.raise_for_status()
        auth_data = auth_response.json()
        access_token = auth_data.get("data", {}).get("access_token")

        if access_token:
            # 2. Get Data
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            data_response = requests.get(data_url, headers=headers, verify=False, timeout=10)
            data_response.raise_for_status()
            response_json = data_response.json()
            
            # Aiyl Bank currently returns just a single balance number as a mock or simple API response in the project
            # API response: {'statusCode': 0, 'message': 'Успешно!', 'state': 'SUCCESS', 'data': 50000.0}
            if response_json.get("state") == "SUCCESS":
                bal = float(response_json.get("data", 0.0))
                now = datetime.now()
                valid_accounts = [{
                    "id": str(uuid.uuid4()),
                    "bank_name": "Айыл Банк",
                    "account_number": "Основной счет KGS",
                    "currency": "KGS",
                    "balance": bal,
                    "last_updated": now
                }]
                return bal, 1, "Подключено", valid_accounts
        return 0.0, 0, "Ошибка (Авторизация не удалась)", []
    except Exception as e:
        print(f"Error fetching Aiyl bank data: {e}")
        return 0.0, 0, "Ошибка", []
