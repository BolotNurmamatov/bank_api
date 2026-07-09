from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import contextlib
from database import engine, Base
from routers import dashboard, auth
from scheduler import start_scheduler
from services.bank_api import update_banks_in_db

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Try to create DB tables and run initial fetch
    try:
        Base.metadata.create_all(bind=engine)
        update_banks_in_db()
    except Exception as e:
        print(f"Warning: Failed to initialize DB on startup. It might be offline. Error: {e}")
        
    # Start background scheduler
    start_scheduler()
    yield

app = FastAPI(title="Treasury Dashboard API", lifespan=lifespan)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(auth.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="[IP_ADDRESS]", port=8000, reload=True)
