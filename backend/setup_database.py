"""
Script to set up the PostgreSQL database for the Fraud Detection application.
Run this script once to create the database and tables.
"""
import psycopg2
from sqlalchemy import create_engine
from database import DATABASE_URL, Base
from models import User, UploadedFile, Prediction, Feedback

def create_database():
    """Create the database if it doesn't exist"""
    # Connect to PostgreSQL server (not to a specific database)
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="rehan"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'fraud_detection_db'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute('CREATE DATABASE fraud_detection_db')
        print("[OK] Database 'fraud_detection_db' created successfully")
    else:
        print("[OK] Database 'fraud_detection_db' already exists")
    
    cursor.close()
    conn.close()

def create_tables():
    """Create all tables"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("[OK] All tables created successfully")

if __name__ == "__main__":
    print("Setting up database...")
    try:
        create_database()
        create_tables()
        print("\n[OK] Database setup complete!")
        print("\nYou can now run the API server with: python main.py")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        print("\nMake sure PostgreSQL is running and the credentials are correct.")
        print("Default credentials: postgres/rehan")
