import numpy as np
import pandas as pd

# -----------------------------
# CONFIG
# -----------------------------
N_ROWS = 200_000
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# -----------------------------
# REALISTIC AMOUNT DISTRIBUTION
# -----------------------------
amount = np.concatenate([
    np.random.randint(100, 5000, int(N_ROWS * 0.60)),      # low
    np.random.randint(5000, 12000, int(N_ROWS * 0.25)),    # medium
    np.random.randint(12000, 50000, int(N_ROWS * 0.15))    # high
])
np.random.shuffle(amount)

# -----------------------------
# OTHER FEATURES
# -----------------------------
hour = np.random.randint(0, 24, N_ROWS)

country = np.random.choice(
    ["India", "USA", "UK", "UAE", "Germany"],
    N_ROWS,
    p=[0.65, 0.0875, 0.0875, 0.0875, 0.0875]
)

merchant_category = np.random.choice(
    ["Grocery", "Electronics", "Luxury", "Travel"],
    N_ROWS
)

device_type = np.random.choice(
    ["Mobile", "Desktop", "Tablet"],
    N_ROWS
)

payment_method = np.random.choice(
    ["UPI", "Credit Card", "Debit Card"],
    N_ROWS
)

# -----------------------------
# LABEL LOGIC (LOCKED)
# -----------------------------
def label_transaction(amt, hr, ctry):
    is_day = 6 <= hr <= 21
    is_night = not is_day

    if ctry == "India":
        if is_day and amt < 5000:
            return "SAFE"
        if is_night and amt < 3000:
            return "SAFE"
        if is_day and 5000 <= amt < 12000:
            return "VERIFY"
        if is_night and 3000 <= amt <= 10000:
            return "VERIFY"
        if is_night and amt > 10000:
            return "BLOCK"
        if is_day and amt > 25000:
            return "BLOCK"
        return "VERIFY"

    else:
        if is_night and amt > 10000:
            return "BLOCK"
        if is_day and amt < 12000:
            return "VERIFY"
        return "VERIFY"

labels = [
    label_transaction(a, h, c)
    for a, h, c in zip(amount, hour, country)
]

# -----------------------------
# CREATE DATAFRAME
# -----------------------------
df = pd.DataFrame({
    "amount": amount,
    "transaction_hour": hour,
    "merchant_category": merchant_category,
    "country": country,
    "device_type": device_type,
    "payment_method": payment_method,
    "label": labels
})

# -----------------------------
# SAVE DATASET
# -----------------------------
df.to_csv("fraud_transactions_200k.csv", index=False)

print("\n✅ Dataset generated successfully!")
print("\nLabel distribution:\n")
print(df["label"].value_counts())
