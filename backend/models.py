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
