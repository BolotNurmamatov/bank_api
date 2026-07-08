from sqlalchemy import Column, Integer, String, Float, DateTime
from clickhouse_sqlalchemy import engines
from database import Base
from datetime import datetime

class Bank(Base):
    __tablename__ = "banks"

    name = Column(String, primary_key=True)
    last_updated = Column(DateTime, primary_key=True, default=datetime.now)
    logo_name = Column(String)
    status = Column(String)
    account_count = Column(Integer)
    balance = Column(Float)

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

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True)  # UUID string
    user_email = Column(String)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

    __table_args__ = (
        engines.MergeTree(order_by=['timestamp', 'id']),
    )
