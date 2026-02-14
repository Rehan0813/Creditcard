import pandas as pd
import random
from datetime import datetime, timedelta

ROWS = 200000

merchant_categories = ["grocery", "electronics", "entertainment", "travel", "fashion"]
countries = ["IN", "US", "UK", "AE", "SG"]
device_types = ["mobile", "desktop", "tablet"]
payment_methods = ["credit_card", "debit_card", "upi", "net_banking"]

def random_time():
    base = datetime(2026, 1, 1)
    random_minutes = random.randint(0, 525600)
    return base + timedelta(minutes=random_minutes)

def is_daytime(hour):
    return 6 <= hour <= 21

def decision_logic(country, amount, daytime):
    # INDIA
    if country == "IN":
        if daytime:
            if amount < 5000:
                return "SAFE"
            elif amount <= 25000:
                return "VERIFY"
            else:
                return "BLOCK"
        else:
            if amount < 3000:
                return "SAFE"
            elif amount <= 10000:
                return "VERIFY"
            else:
                return "BLOCK"

    # FOREIGN
    else:
        if daytime:
            if amount <= 20000:
                return "VERIFY"
            else:
                return "BLOCK"
        else:
            if amount <= 10000:
                return "VERIFY"
            else:
                return "BLOCK"

data = []

for i in range(ROWS):
    amount = random.randint(100, 50000)
    country = random.choice(countries)
    time_obj = random_time()
    daytime = is_daytime(time_obj.hour)

    label = decision_logic(country, amount, daytime)

    data.append([
        f"TXN-{i}",
        amount,
        country,
        random.choice(merchant_categories),
        random.choice(payment_methods),
        random.choice(device_types),
        time_obj.isoformat(),
        label
    ])

columns = [
    "transaction_id",
    "amount",
    "country",
    "merchant_category",
    "payment_method",
    "device_type",
    "transaction_time",
    "label"
]

df = pd.DataFrame(data, columns=columns)
df.to_csv("data/fraud_transactions_200k_final.csv", index=False)

print("✅ 200,000 row dataset generated successfully!")