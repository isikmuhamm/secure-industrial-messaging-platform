"""
Database Configuration Module
Handles PostgreSQL connection and session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import sqlalchemy.orm

# PostgreSQL connection URL
SQLALCHEMY_DATABASE_URL = "postgresql://chattin:1234@localhost/chattin_db"

"""
Database Setup SQL Commands:

CREATE DATABASE chattin_db;
CREATE USER chattin WITH PASSWORD '1234';
ALTER ROLE chattin SET client_encoding TO 'utf8';
ALTER ROLE chattin SET default_transaction_isolation TO 'read committed';
ALTER ROLE chattin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE chattin_db TO chattin;
"""

# Database engine with connection pooling
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_size=10, max_overflow=20)

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = sqlalchemy.orm.declarative_base()

# Set default schema to public
Base.metadata.schema = 'public'


def get_db():
    """Database session dependency for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
