import json

notebook_path = 'c:/Users/rehan/OneDrive/Desktop/cre/Credit Card Fraud Mlops/Credit Card Fraud Mlops/Notebooks/03_feature_engineering_pipeline.ipynb'

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

code_cells = [cell['source'] for cell in nb['cells'] if cell['cell_type'] == 'code']

output_path = 'c:/Users/rehan/OneDrive/Desktop/cre/notebook_code_extracted.py'
with open(output_path, 'w', encoding='utf-8') as f:
    for i, cell in enumerate(code_cells):
        f.write(f"# --- CELL {i} ---\n")
        f.write("".join(cell))
        f.write("\n\n")

print(f"Extracted {len(code_cells)} code cells to {output_path}")
