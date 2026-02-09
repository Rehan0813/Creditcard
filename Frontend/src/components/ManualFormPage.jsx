import React, { useState } from 'react';
import FraudForm from './FraudForm';
import { fraudApi } from '../api/fraudApi';

const ManualFormPage = ({ setCurrentPage, setResult }) => {
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  const handleSubmit = async (formValues) => {
    setLoading(true);
    try {
      const response = await fraudApi.predictTransaction(formValues);

      const rl = response.risk_level;
      const riskEmoji = rl === 'High' ? '🔴' : rl === 'Medium' ? '🟡' : '🟢';

      const resultPayload = {
        score: (response.fraud_score || 0).toFixed(2),
        riskLevel: rl,
        riskEmoji,
        action: response.recommended_action,
        reasons: response.reasons || [],
        prediction_id: response.prediction_id,
        transactionId: `TXN-${response.prediction_id}`,
        amount: formValues.amount,
        country: formValues.country,
        merchantCategory: formValues.merchant_category,
        paymentMethod: formValues.payment_method,
        transactionTime: formValues.transaction_time,
      };

      setResult(resultPayload);
      setCurrentPage('analysisreport');
    } catch (err) {
      console.error('Manual form prediction error:', err);
      alert(err.message || 'Failed to analyze transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '24px 20px 60px',
        minHeight: '100%',
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        boxSizing: 'border-box',
        background: 'transparent',
      }}
    >
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          background: 'rgba(56, 189, 248, 0.3)',
          border: '2px solid rgba(56, 189, 248, 0.6)',
          borderRadius: '10px',
          color: '#e0f2fe',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 30,
          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)',
        }}
      >
        ← Back to Dashboard
      </button>

      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          marginTop: '40px',
        }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: '30px',
            fontWeight: 'bold',
            marginBottom: '8px',
            background:
              'linear-gradient(135deg, #60a5fa 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Enter a Single Transaction
        </h2>
        <p
          style={{
            color: '#9ca3af',
            fontSize: '14px',
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          If you do not have a CSV or Excel file, you can manually enter one
          transaction here and run the same fraud analysis.
        </p>
      </div>

      <FraudForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default ManualFormPage;

