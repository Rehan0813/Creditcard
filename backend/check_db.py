import sqlite3
import os

db_path = r"c:\Users\rehan\OneDrive\Desktop\cre\backend\credimap.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, fraud_score FROM predictions ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()
    print("Latest 10 Fraud Scores:")
    for row in rows:
        print(f"ID: {row[0]}, Amount: {row[1]}, Score: {row[2]}")
    conn.close()
else:
    print(f"Database not found at {db_path}")
