from apscheduler.schedulers.background import BackgroundScheduler
from services.bank_api import update_banks_in_db

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(update_banks_in_db, 'interval', minutes=1)
    scheduler.start()
