from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# We will run the backend from the api_bank folder or inside backend folder
# Defaulting to the postgres service from docker-compose
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "clickhouse://default:root@10.45.51.1:8888/default")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
