from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# PostgreSQL database URL (Render uses postgres://; SQLAlchemy needs postgresql://)
_raw = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:rehan@localhost:5432/fraud_detection_db"
)
DATABASE_URL = _raw.replace("postgres://", "postgresql://", 1) if _raw.startswith("postgres://") else _raw

# Render and most cloud Postgres require SSL; use pool_pre_ping to avoid stale connections
_connect_args = {}
if "render.com" in DATABASE_URL or "oregon-postgres" in DATABASE_URL:
    _connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args if _connect_args else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
 