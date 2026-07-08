from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Bank
from schemas import DashboardResponse, DashboardStats, BankResponse
from services.bank_api import update_banks_in_db

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(db: Session = Depends(get_db)):
    all_records = db.query(Bank).order_by(Bank.last_updated.desc()).all()
    
    # Get latest record per bank
    latest_banks = {}
    for record in all_records:
        if record.name not in latest_banks:
            latest_banks[record.name] = record
            
    banks = list(latest_banks.values())
    
    total_balance = sum([b.balance for b in banks])
    total_banks_connected = len([b for b in banks if b.status == "Подключено"])
    total_accounts = sum([b.account_count for b in banks])
    last_updated = banks[0].last_updated if banks else None

    stats = DashboardStats(
        total_balance=total_balance,
        total_banks_connected=total_banks_connected,
        total_accounts=total_accounts,
        last_updated=last_updated
    )

    return DashboardResponse(stats=stats, banks=banks)

@router.post("/refresh", response_model=DashboardResponse)
def refresh_dashboard_data(db: Session = Depends(get_db)):
    # Trigger manual refresh
    update_banks_in_db()
    return get_dashboard_data(db)
