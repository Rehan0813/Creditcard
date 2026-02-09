# Credit Card Fraud Detection – Machine Learning

This project implements a multi-class fraud detection system that classifies transactions into:
- SAFE
- VERIFY
- BLOCK

The model is trained using engineered transaction features and probability-based decisioning.

---

## 📊 Features Used
- Transaction amount
- Transaction time (hour, is_night)
- Amount bucket (low / medium / high)
- Merchant category
- Country
- Device type
- Payment method

---

## 🤖 Model Details
- Algorithm: XGBoost (Multi-class Classification)
- Output: SAFE / VERIFY / BLOCK
- Decision Logic: Probability-based thresholds
- Evaluation Metrics: Precision, Recall, F1-score

---

## 📁 Project Structure
