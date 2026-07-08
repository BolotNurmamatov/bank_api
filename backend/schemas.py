from pydantic import BaseModel
from datetime import datetime
from typing import List

class BankBase(BaseModel):
    name: str
    logo_name: str
    status: str
    account_count: int
    balance: float

class BankCreate(BankBase):
    pass

class BankResponse(BankBase):
    last_updated: datetime

    class Config:
        from_attributes = True

class BankAccountBase(BaseModel):
    id: str
    bank_name: str
    account_number: str
    currency: str
    balance: float
    last_updated: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_balance: float
    total_banks_connected: int
    total_accounts: int
    last_updated: datetime | None

class DashboardResponse(BaseModel):
    stats: DashboardStats
    banks: List[BankResponse]
    accounts: List[BankAccountBase] = []
