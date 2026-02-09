import pandas as pd
import json
df = pd.read_csv('c:/Users/rehan/OneDrive/Desktop/cre/fraud_training_dataset_50k.csv')
info = {
    "columns": df.columns.tolist(),
    "head": df.head(5).to_dict(orient='records'),
    "value_counts": {
        "label": df['label'].value_counts().to_dict(),
        "country": df['country'].value_counts().head(5).to_dict()
    }
}
with open('c:/Users/rehan/OneDrive/Desktop/cre/inspection_data.json', 'w') as f:
    json.dump(info, f, indent=4)
print("Done")
