import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_rule_based_dataset(n_samples=50000):
    """
    Generate a dataset that reflects the user's business rules:
    
    SAFE Rules:
    1. India + Daytime (6-22) + Amount < 5000 -> SAFE
    2. India + Night (22-6) + Amount < 3000 -> SAFE
    
    VERIFY Rules:
    3. Non-India (any amount, any time) -> VERIFY
    
    BLOCK Rules:
    4. India + Daytime + Amount >= 5000 -> BLOCK
    5. India + Night + Amount >= 3000 -> BLOCK
    """
    
    data = []
    
    # Categories from original dataset
    categories = ['services', 'fashion', 'food', 'grocery', 'electronics', 'travel']
    countries = ['india', 'usa', 'uk', 'uae', 'germany']
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
        
        # Decide country and amount based on distribution
        # 60% India, 40% International
        is_india = random.random() < 0.6
        
        if is_india:
            country = 'india'
            
            # Determine if daytime or night
            is_daytime = 6 <= hour < 22
            
            if is_daytime:
                # Daytime: 70% safe (<5000), 30% block (>=5000)
                if random.random() < 0.7:
                    amount = random.uniform(100, 4999)
                    label = 'safe'
                else:
                    amount = random.uniform(5000, 30000)
                    label = 'block'
            else:
                # Night: 70% safe (<3000), 30% block (>=3000)
                if random.random() < 0.7:
                    amount = random.uniform(100, 2999)
                    label = 'safe'
                else:
                    amount = random.uniform(3000, 30000)
                    label = 'block'
        else:
            # International -> Always VERIFY
            country = random.choice(['usa', 'uk', 'uae', 'germany'])
            amount = random.uniform(100, 30000)
            label = 'verify'
        
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
    print("Generating rule-based training dataset...")
    df = generate_rule_based_dataset(50000)
    
    # Save
    output_path = "fraud_training_dataset_rule_based.csv"
    df.to_csv(output_path, index=False)
    
    print(f"\nDataset saved to: {output_path}")
    print(f"Total samples: {len(df)}")
    print("\nLabel distribution:")
    print(df['label'].value_counts())
    print("\nCountry distribution:")
    print(df['country'].value_counts())
    print("\nSample rows:")
    print(df.head(10))
