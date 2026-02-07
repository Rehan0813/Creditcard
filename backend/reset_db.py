
from database import engine, Base
from sqlalchemy import text
from models import User, UploadedFile, Prediction, Feedback

def reset_database():
    print("Resetting database...")
    
    # Create a connection
    with engine.connect() as connection:
        # Begin transaction
        with connection.begin():
            # Disable foreign key checks to allow truncation
            # connection.execute(text("SET session_replication_role = 'replica';")) # For Postgres if needed, but CASCADE usually works
            
            print("Dropping all tables...")
            Base.metadata.drop_all(bind=engine)
            
            print("Recreating all tables...")
            Base.metadata.create_all(bind=engine)
            
    print("Database reset complete. All data has been cleared.")

if __name__ == "__main__":
    confirm = input("Are you sure you want to DELETE ALL DATA? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
    else:
        print("Operation cancelled.")
