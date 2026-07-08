import sys
from database import SessionLocal, engine, Base
from models import Bank
from services.bank_api import update_banks_in_db

print("Creating tables...")
Base.metadata.create_all(bind=engine)

print("Running update...")
update_banks_in_db()

print("Querying DB...")
db = SessionLocal()
banks = db.query(Bank).all()
print("Banks found:", len(banks))
for b in banks:
    print(b.name, b.balance, b.last_updated)
db.close()
