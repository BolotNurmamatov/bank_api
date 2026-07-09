from sqlalchemy import Column, Integer, String, Float, DateTime
from clickhouse_sqlalchemy import engines
from database import Base
from datetime import datetime

from clickhouse_sqlalchemy.types import Float64

class Bank(Base):
    __tablename__ = "banks"

    name = Column(String, primary_key=True)
    last_updated = Column(DateTime, primary_key=True, default=datetime.now)
    logo_name = Column(String)
    status = Column(String)
    account_count = Column(Integer)
    balance = Column(Float64)

    __table_args__ = (
        engines.MergeTree(order_by=['name', 'last_updated']),
    )

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True)
    name = Column(String)
    last_login = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        engines.MergeTree(order_by=['email']),
    )

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(String, primary_key=True) # unique UUID
    bank_name = Column(String)
    account_number = Column(String)
    currency = Column(String)
    balance = Column(Float64)
    last_updated = Column(DateTime, default=datetime.now)

    __table_args__ = (
        engines.MergeTree(order_by=['bank_name', 'account_number', 'id']),
    )

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True)  # UUID string
    user_email = Column(String)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

    __table_args__ = (
        engines.MergeTree(order_by=['timestamp', 'id']),
    )
