import requests
import urllib3
import os
import uuid
from sqlalchemy.orm import Session
from datetime import datetime
from models import Bank, BankAccount
from database import SessionLocal

from services.eldik import fetch_eldik_accounts
from services.optima import fetch_optima_accounts
from services.aiyl import fetch_aiyl_accounts

# Suppress insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_bank_data():
    """
    Fetches bank data and individual accounts from all modular bank services.
    Returns (banks_summary, all_accounts)
    """
    # 1. Aiyl Bank
    aiyl_bal, aiyl_count, aiyl_status, aiyl_accs = fetch_aiyl_accounts()
    
    # 2. Optima Bank
    opt_bal, opt_count, opt_status, opt_accs = fetch_optima_accounts()
    
    # 3. Eldik Bank
    eldik_bal, eldik_count, eldik_status, eldik_accs = fetch_eldik_accounts()
    
    # 4. MBank (Simulated for now, as no script was provided)
    mbank_bal = 20250000.0
    mbank_count = 3
    mbank_status = "Подключено"
    mbank_accs = [
        {"id": str(uuid.uuid4()), "bank_name": "Мбанк", "account_number": "MB-123456", "currency": "KGS", "balance": 10000000.0, "last_updated": datetime.now()},
        {"id": str(uuid.uuid4()), "bank_name": "Мбанк", "account_number": "MB-654321", "currency": "KGS", "balance": 5250000.0, "last_updated": datetime.now()},
        {"id": str(uuid.uuid4()), "bank_name": "Мбанк", "account_number": "MB-999999", "currency": "KGS", "balance": 5000000.0, "last_updated": datetime.now()},
    ]

    banks_summary = [
        {"name": "Айыл Банк", "logo_name": "aiyl", "status": aiyl_status, "account_count": aiyl_count, "balance": aiyl_bal},
        {"name": "Оптима Банк", "logo_name": "optima", "status": opt_status, "account_count": opt_count, "balance": opt_bal},
        {"name": "Мбанк", "logo_name": "mbank", "status": mbank_status, "account_count": mbank_count, "balance": mbank_bal},
        {"name": "Элдик Банк", "logo_name": "eldik", "status": eldik_status, "account_count": eldik_count, "balance": eldik_bal}
    ]
    
    all_accounts = aiyl_accs + opt_accs + eldik_accs + mbank_accs
    
    return banks_summary, all_accounts

def update_banks_in_db():
    print(f"[{datetime.now()}] Updating bank data...")
    banks_summary, all_accounts = fetch_bank_data()
    db: Session = SessionLocal()
    
    try:
        now = datetime.now()
        # 1. Update Banks
        for bank_data in banks_summary:
            db_bank = Bank(
                name=bank_data["name"],
                logo_name=bank_data["logo_name"],
                status=bank_data["status"],
                account_count=bank_data["account_count"],
                balance=bank_data["balance"],
                last_updated=now
            )
            db.add(db_bank)
            
        # 2. Update Bank Accounts
        for acc_data in all_accounts:
            db_acc = BankAccount(
                id=acc_data["id"],
                bank_name=acc_data["bank_name"],
                account_number=acc_data["account_number"],
                currency=acc_data["currency"],
                balance=acc_data["balance"],
                last_updated=acc_data["last_updated"]
            )
            db.add(db_acc)
            
        db.commit()
        print("Bank data updated successfully.")
    except Exception as e:
        print(f"Error updating DB: {e}")
        db.rollback()
    finally:
        db.close()

