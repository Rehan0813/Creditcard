import sys
import os
import pandas as pd
import logging

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

from main import calculate_prediction, calculate_rule_risk

def test_hybrid_logic():
    print("\n[TEST] Testing Hybrid Fraud Detection Logic\n")

    test_cases = [
        {
            "name": "Domestic SAFE Low (Daytime, Amount=500)",
            "data": {
                "amount": 500,
                "country": "India",
                "transaction_time": "2023-10-27 14:30:00"
            },
            "expected_rule_range": (0, 10), # Low in safe zone
            "expected_action": "Safe"
        },
        {
            "name": "Domestic SAFE High (Daytime, Amount=4500)",
            "data": {
                "amount": 4500,
                "country": "India",
                "transaction_time": "2023-10-27 14:30:00"
            },
            "expected_rule_range": (25, 30), # High in safe zone
            "expected_action": "Safe"
        },
        {
            "name": "Domestic VERIFY Low (Daytime, Amount=6000)",
            "data": {
                "amount": 6000,
                "country": "India",
                "transaction_time": "2023-10-27 14:30:00"
            },
            "expected_rule_range": (31, 40), # Low in verify zone
            "expected_action": "Verify"
        },
        {
            "name": "Domestic VERIFY High (Daytime, Amount=24000)",
            "data": {
                "amount": 24000,
                "country": "India",
                "transaction_time": "2023-10-27 14:30:00"
            },
            "expected_rule_range": (65, 70), # High in verify zone
            "expected_action": "Verify"
        },
        {
            "name": "Domestic BLOCK (Nighttime, Amount=15000)",
            "data": {
                "amount": 15000,
                "country": "India",
                "transaction_time": "2023-10-27 03:00:00" # Nighttime
            },
            "expected_rule_range": (71, 100), # Block zone
            "expected_action": "Block"
        },
        {
            "name": "Foreign VERIFY (Daytime, Amount=5000)",
            "data": {
                "amount": 5000,
                "country": "USA",
                "transaction_time": "2023-10-27 14:00:00"
            },
            "expected_rule_range": (35, 50), # Foreign starts higher
            "expected_action": "Verify"
        },
        {
            "name": "Foreign BLOCK (Daytime, Amount=25000)",
            "data": {
                "amount": 25000,
                "country": "USA",
                "transaction_time": "2023-10-27 14:00:00"
            },
            "expected_rule_range": (71, 100), # Block zone
            "expected_action": "Block"
        }
    ]

    for case in test_cases:
        print(f"[TEST] Testing: {case['name']}")
        result = calculate_prediction(case['data'])
        
        # Check Rule Score (extracted from reasons)
        reasons = result.get("reasons", [])
        
        fraud_score = result['fraud_score'] * 100
        action = result['recommended_action']
        
        print(f"   Original Data: {case['data']}")
        print(f"   Result -> Score: {fraud_score:.2f}, Action: {action}")
        print(f"   Reasons: {reasons[:3]}") # Show top reasons
        
        print("-" * 50)

if __name__ == "__main__":
    test_hybrid_logic()
