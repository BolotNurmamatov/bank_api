from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import contextlib
from database import engine, Base
from routers import dashboard, auth
from scheduler import start_scheduler
from services.bank_api import update_banks_in_db

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Initial fetch and populate DB on startup
    update_banks_in_db()
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
