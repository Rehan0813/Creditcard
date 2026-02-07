from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# PostgreSQL database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:rehan@localhost:5432/fraud_detection_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
