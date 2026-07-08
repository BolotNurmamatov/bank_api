from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from database import get_db
from models import Bank, ActivityLog, BankAccount
from schemas import DashboardResponse, DashboardStats, BankResponse, BankAccountBase, HistoryResponse, HistoryDataPoint
from services.bank_api import update_banks_in_db
from routers.auth import verify_internal_secret
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse, dependencies=[Depends(verify_internal_secret)])
def get_dashboard_data(user_email: str, db: Session = Depends(get_db)):
    all_records = db.query(Bank).order_by(Bank.last_updated.desc()).all()
    
    # Get latest record per bank
    latest_banks = {}
    for record in all_records:
        if record.name not in latest_banks:
            latest_banks[record.name] = record
            
    banks = list(latest_banks.values())
    
    # Get latest accounts per bank_name + account_number
    all_accounts_records = db.query(BankAccount).order_by(BankAccount.last_updated.desc()).all()
    latest_accounts = {}
    for acc in all_accounts_records:
        key = f"{acc.bank_name}_{acc.account_number}"
        if key not in latest_accounts:
            latest_accounts[key] = acc
            
    accounts = list(latest_accounts.values())
    
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

    # Log the action
    if user_email:
        log = ActivityLog(id=str(uuid.uuid4()), user_email=user_email, action="Viewed Dashboard")
        db.add(log)
        db.commit()

    return DashboardResponse(stats=stats, banks=banks, accounts=accounts)

@router.post("/refresh", response_model=DashboardResponse, dependencies=[Depends(verify_internal_secret)])
def refresh_dashboard_data(user_email: str, db: Session = Depends(get_db)):
    # Trigger manual refresh
    update_banks_in_db()
    
    # Log the action
    if user_email:
        log = ActivityLog(id=str(uuid.uuid4()), user_email=user_email, action="Refreshed Dashboard Data")
        db.add(log)
        db.commit()
        
    return get_dashboard_data(user_email=user_email, db=db)

@router.get("/history", response_model=HistoryResponse, dependencies=[Depends(verify_internal_secret)])
def get_dashboard_history(
    time_range: str = Query("today", regex="^(hour|today|week|month)$"),
    user_email: str = None, 
    db: Session = Depends(get_db)
):
    now = datetime.now()
    
    if time_range == "hour":
        start_time = now - timedelta(hours=1)
        time_bucket_func = "toStartOfFiveMinutes(last_updated)"
    elif time_range == "today":
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        time_bucket_func = "toStartOfHour(last_updated)"
    elif time_range == "week":
        start_time = now - timedelta(days=7)
        time_bucket_func = "toStartOfDay(last_updated)"
    else: # month
        start_time = now - timedelta(days=30)
        time_bucket_func = "toStartOfDay(last_updated)"

    query = db.query(
        text(f"{time_bucket_func} as time_bucket"),
        Bank.name,
        func.argMax(Bank.balance, Bank.last_updated).label('balance')
    ).filter(
        Bank.last_updated >= start_time
    ).group_by(
        text("time_bucket"),
        Bank.name
    ).order_by(
        text("time_bucket")
    )
    
    results = query.all()
    
    # Organize data: Group by time_bucket, then map bank_name -> balance
    time_buckets = {}
    for row in results:
        # Depending on the ClickHouse driver, row[0] might be a datetime object or a string
        bucket = row[0] if isinstance(row[0], datetime) else datetime.fromisoformat(row[0])
        bank_name = row[1]
        balance = row[2]
        
        if bucket not in time_buckets:
            time_buckets[bucket] = {}
            
        time_buckets[bucket][bank_name] = balance
        
    history_data = []
    for bucket in sorted(time_buckets.keys()):
        history_data.append(HistoryDataPoint(
            time_bucket=bucket,
            balances=time_buckets[bucket]
        ))
        
    return HistoryResponse(data=history_data)
