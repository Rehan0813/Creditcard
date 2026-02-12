import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_final_logic_dataset(n_samples=50000):
    """
    Generate dataset based on FINAL DECISION LOGIC:
    
    TIME DEFINITIONS:
    - Daytime: 06:00 - 21:59
    - Night/Midnight: 22:00 - 05:59
    
    SAFE (India only):
    - India + Daytime + amount < 5000
    - India + Nighttime + amount < 3000
    
    VERIFY:
    - India + Daytime + 5000 <= amount < 12000
    - India + Nighttime + 3000 <= amount <= 10000
    - Not India + Daytime + amount < 12000
    - Not India + Nighttime + amount <= 10000
    
    BLOCK:
    - Not India + Nighttime + amount > 10000
    - India + Nighttime + amount > 10000
    - India + Daytime + amount >= 12000
    """
    
    data = []
    
    # Categories
    categories = ['services', 'fashion', 'food', 'grocery', 'electronics', 'travel']
    countries_india = ['india']
    countries_foreign = ['usa', 'uk', 'uae', 'germany']
    devices = ['tablet', 'mobile', 'desktop']
    payment_methods = ['upi', 'debit_card', 'credit_card']
    
    for _ in range(n_samples):
        # Random base features
        category = random.choice(categories)
        device = random.choice(devices)
        payment = random.choice(payment_methods)
        
        # Generate timestamp
        start_date = datetime(2024, 1, 1)
        random_days = random.randint(0, 365)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        timestamp = start_date + timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
        hour = timestamp.hour
        
        # Determine if daytime or night
        is_daytime = 6 <= hour < 22  # 06:00 - 21:59
        
        # 60% India, 40% Foreign
        is_india = random.random() < 0.6
        
        if is_india:
            country = 'india'
            
            if is_daytime:
                # India + Daytime
                rand = random.random()
                if rand < 0.5:  # 50% SAFE
                    amount = random.uniform(100, 4999.99)
                    label = 'safe'
                elif rand < 0.8:  # 30% VERIFY
                    amount = random.uniform(5000, 11999.99)
                    label = 'verify'
                else:  # 20% BLOCK
                    amount = random.uniform(12000, 30000)
                    label = 'block'
            else:
                # India + Nighttime
                rand = random.random()
                if rand < 0.5:  # 50% SAFE
                    amount = random.uniform(100, 2999.99)
                    label = 'safe'
                elif rand < 0.8:  # 30% VERIFY
                    amount = random.uniform(3000, 10000)
                    label = 'verify'
                else:  # 20% BLOCK
                    amount = random.uniform(10000.01, 30000)
                    label = 'block'
        else:
            # Foreign
            country = random.choice(countries_foreign)
            
            if is_daytime:
                # Not India + Daytime
                rand = random.random()
                if rand < 0.7:  # 70% VERIFY
                    amount = random.uniform(100, 11999.99)
                    label = 'verify'
                else:  # 30% BLOCK
                    amount = random.uniform(12000, 30000)
                    label = 'block'
            else:
                # Not India + Nighttime
                rand = random.random()
                if rand < 0.6:  # 60% VERIFY
                    amount = random.uniform(100, 10000)
                    label = 'verify'
                else:  # 40% BLOCK
                    amount = random.uniform(10000.01, 30000)
                    label = 'block'
        
        data.append({
            'amount': round(amount, 1),
            'transaction_time': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'merchant_category': category,
            'country': country,
            'device_type': device,
            'payment_method': payment,
            'label': label
        })
    
    df = pd.DataFrame(data)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df

if __name__ == "__main__":
    print("Generating FINAL LOGIC training dataset...")
    df = generate_final_logic_dataset(50000)
    
    # Save
    output_path = "fraud_training_dataset_final.csv"
    df.to_csv(output_path, index=False)
    
    print(f"\nDataset saved to: {output_path}")
    print(f"Total samples: {len(df)}")
    print("\nLabel distribution:")
    print(df['label'].value_counts())
    print("\nCountry distribution:")
    print(df['country'].value_counts())
    
    # Verify test cases
    print("\n" + "="*60)
    print("VERIFYING TEST CASES FROM USER LOGIC")
    print("="*60)
    
    test_cases = [
        {"amount": 2000, "hour": 14, "country": "india", "expected": "safe"},
        {"amount": 5000, "hour": 14, "country": "india", "expected": "verify"},
        {"amount": 8000, "hour": 2, "country": "india", "expected": "verify"},
        {"amount": 12000, "hour": 2, "country": "india", "expected": "block"},
        {"amount": 20000, "hour": 14, "country": "usa", "expected": "verify"},
        {"amount": 2000, "hour": 14, "country": "usa", "expected": "verify"},
    ]
    
    for i, tc in enumerate(test_cases, 1):
        is_daytime = 6 <= tc["hour"] < 22
        time_str = "Daytime" if is_daytime else "Nighttime"
        print(f"\n{i}. Amount={tc['amount']}, {time_str}, {tc['country'].upper()}")
        print(f"   Expected: {tc['expected'].upper()}")
