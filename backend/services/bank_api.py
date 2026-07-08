import requests
import urllib3
import os
from sqlalchemy.orm import Session
from datetime import datetime
from models import Bank
from database import SessionLocal

# Suppress insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_bank_data():
    """
    Fetches the latest bank data from the real API for the main bank,
    and returns a list of dictionaries simulating other banks as well.
    """
    auth_url = os.getenv("ABANK_URL_AUTH")
    data_url = os.getenv("DATA_URL")
    username = os.getenv("ABANK_USERNAME")
    password = os.getenv("ABANK_PASSWORD")

    main_bank_balance = 0.0
    main_bank_status = "Ошибка"

    if auth_url and username and password and data_url:
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
                
                # API response: {'statusCode': 0, 'message': 'Успешно!', 'state': 'SUCCESS', 'data': 50000.0}
                if response_json.get("state") == "SUCCESS":
                    main_bank_balance = float(response_json.get("data", 0.0))
                    main_bank_status = "Подключено"
        except Exception as e:
            print(f"Error fetching real bank data: {e}")

    # For the UI dashboard, we simulate the other banks if they aren't real yet
    banks_data = [
        {
            "name": "Айыл Банк",
            "logo_name": "aiyl",
            "status": main_bank_status,
            "account_count": 1,
            "balance": main_bank_balance
        },
        {
            "name": "Оптима Банк",
            "logo_name": "optima",
            "status": "Подключено",
            "account_count": 4,
            "balance": 45250000.0
        },
        {
            "name": "Мбанк",
            "logo_name": "mbank",
            "status": "Подключено",
            "account_count": 3,
            "balance": 20250000.0
        },
        {
            "name": "Элдик Банк",
            "logo_name": "eldik",
            "status": "Подключено",
            "account_count": 2,
            "balance": 27150000.0
        }
    ]
    return banks_data

def update_banks_in_db():
    print(f"[{datetime.now()}] Updating bank data...")
    banks_data = fetch_bank_data()
    db: Session = SessionLocal()
    
    try:
        for bank_data in banks_data:
            db_bank = Bank(
                name=bank_data["name"],
                logo_name=bank_data["logo_name"],
                status=bank_data["status"],
                account_count=bank_data["account_count"],
                balance=bank_data["balance"],
                last_updated=datetime.now()
            )
            db.add(db_bank)
        db.commit()
        print("Bank data updated successfully.")
    except Exception as e:
        print(f"Error updating DB: {e}")
        db.rollback()
    finally:
        db.close()
