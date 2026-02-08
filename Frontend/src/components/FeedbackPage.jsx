import React, { useState } from 'react';
import { fraudApi } from '../api/fraudApi';

/**
 * Full-page Feedback & Review (same layout as How to Use / Model Evaluation).
 * NET background from VantaNetLayout shows through.
 */
const FeedbackPage = ({ result, setCurrentPage }) => {
  const [feedbackData, setFeedbackData] = useState({
    humanDecision: '',
    reasons: [],
    thoughts: '',
    modelRating: '',
    isSubmitted: false,
    submissionTime: null
  });

  // When multiple transactions (batch), always show the highest risk for feedback
  const isBatch = result?.allPredictions?.length > 1;
  const overallScore = isBatch && result?.allPredictions?.length
    ? Math.max(...result.allPredictions.map((p) => p.fraud_score ?? 0))
    : null;
  const getRiskFromScore = (s) => {
    if (s < 0.3) return { level: 'Low', action: 'Safe' };
    if (s < 0.7) return { level: 'Medium', action: 'Verify' };
    return { level: 'High', action: 'Block' };
  };
  const batchRisk = overallScore != null ? getRiskFromScore(overallScore) : null;
  const displayScore = isBatch && overallScore != null ? Number(overallScore).toFixed(2) : result?.score;
  const displayLevel = isBatch && batchRisk ? batchRisk.level : result?.riskLevel;
  const displayAction = isBatch && batchRisk ? batchRisk.action : result?.action;
  const displayResult = result
    ? { ...result, score: displayScore, riskLevel: displayLevel, action: displayAction }
    : { score: '0.00', riskLevel: 'Unknown', action: 'Unknown' };

  return (
    <div style={{
      position: 'relative',
      padding: '20px 20px 60px',
      minHeight: '100%',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      boxSizing: 'border-box',
      background: 'transparent'
    }}>
      <button
        onClick={() => setCurrentPage('dashboard')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          background: 'rgba(56, 189, 248, 0.3)',
          border: '2px solid rgba(56, 189, 248, 0.6)',
          borderRadius: '12px',
          color: '#e0f2fe',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 30,
          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
        }}
      >
        📖 Back to Dashboard
      </button>

      <h2 style={{
        color: 'white',
        fontSize: '36px',
        fontWeight: 'bold',
        marginBottom: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #3b9eff 0%, #a855f7 50%, #f472b6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        📝 Review Fraud Prediction
      </h2>

      {/* Model's Decision */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 158, 255, 0.15), rgba(168, 85, 247, 0.1))',
        border: '2px solid rgba(59, 158, 255, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <h3 style={{ color: '#3b9eff', fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase' }}>🤖 Model's Decision (Read-Only)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e5e7eb', fontSize: '14px' }}>Model Risk Score:</span>
            <span style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 'bold', padding: '4px 12px', background: 'rgba(96, 165, 250, 0.2)', borderRadius: '6px' }}>{displayResult.score}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e5e7eb', fontSize: '14px' }}>Model Risk Level:</span>
            <span style={{
              color: (displayResult.riskLevel === 'High Risk' || displayResult.riskLevel === 'High') ? '#ef4444' : (displayResult.riskLevel === 'Medium Risk' || displayResult.riskLevel === 'Medium') ? '#f59e0b' : '#10b981',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '4px 12px',
              background: (displayResult.riskLevel === 'High Risk' || displayResult.riskLevel === 'High') ? 'rgba(239, 68, 68, 0.2)' : (displayResult.riskLevel === 'Medium Risk' || displayResult.riskLevel === 'Medium') ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              borderRadius: '6px'
            }}>{displayResult.riskLevel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e5e7eb', fontSize: '14px' }}>Model Recommendation:</span>
            <span style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 'bold', padding: '4px 12px', background: 'rgba(167, 139, 250, 0.2)', borderRadius: '6px' }}>{displayResult.action}</span>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      <div style={{ marginBottom: '28px', background: 'rgba(30, 41, 59, 0.6)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>Step 1: Decision Confirmation (Required)</h3>
        <p style={{ color: '#e5e7eb', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>Is this transaction actually fraudulent?</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={() => setFeedbackData({ ...feedbackData, humanDecision: 'fraud' })}
            style={{
              flex: 1,
              padding: '18px 28px',
              background: feedbackData.humanDecision === 'fraud' ? 'linear-gradient(135deg, #f87171, #ef4444)' : 'rgba(248, 113, 113, 0.15)',
              border: feedbackData.humanDecision === 'fraud' ? '2px solid #f87171' : '2px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '12px',
              color: feedbackData.humanDecision === 'fraud' ? 'white' : '#f87171',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >✔ Yes, this is Fraud</button>
          <button
            onClick={() => setFeedbackData({ ...feedbackData, humanDecision: 'legit' })}
            style={{
              flex: 1,
              padding: '18px 28px',
              background: feedbackData.humanDecision === 'legit' ? 'linear-gradient(135deg, #34d399, #10b981)' : 'rgba(52, 211, 153, 0.15)',
              border: feedbackData.humanDecision === 'legit' ? '2px solid #34d399' : '2px solid rgba(52, 211, 153, 0.4)',
              borderRadius: '12px',
              color: feedbackData.humanDecision === 'legit' ? 'white' : '#34d399',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >❌ No, this is Legit</button>
        </div>
      </div>

      {/* Step 2 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Step 2: Reason + Thoughts (Optional)</h3>
        <p style={{ color: '#e5e7eb', fontSize: '14px', marginBottom: '8px' }}>Why do you think this transaction is fraud or legit?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {['customer_confirmed', 'trusted_merchant', 'false_positive', 'unusual_behavior', 'normal_behavior', 'other'].map((value, i) => {
            const labels = ['Customer confirmed fraud', 'Known / trusted merchant', 'False positive', 'Unusual transaction behavior', 'Normal customer behavior', 'Other'];
            return (
              <label key={value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: feedbackData.reasons?.includes(value) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: feedbackData.reasons?.includes(value) ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={feedbackData.reasons?.includes(value) || false}
                  onChange={(e) => {
                    const current = feedbackData.reasons || [];
                    if (e.target.checked) setFeedbackData({ ...feedbackData, reasons: [...current, value] });
                    else setFeedbackData({ ...feedbackData, reasons: current.filter(r => r !== value) });
                  }}
                  style={{ width: 18, height: 18, accentColor: '#60a5fa' }}
                />
                <span style={{ color: feedbackData.reasons?.includes(value) ? '#60a5fa' : '#e5e7eb', fontSize: '14px' }}>{labels[i]}</span>
              </label>
            );
          })}
        </div>
        <p style={{ color: '#e5e7eb', fontSize: '14px', marginBottom: '8px' }}>Additional comments (optional)</p>
        <textarea
          value={feedbackData.thoughts || ''}
          onChange={(e) => setFeedbackData({ ...feedbackData, thoughts: e.target.value })}
          placeholder="Short free-text input for human reasoning / observations"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e5e7eb',
            fontSize: '14px',
            resize: 'none',
            rows: 3,
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Step 3 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Step 3: Rate the Model (Required)</h3>
        <p style={{ color: '#e5e7eb', fontSize: '14px', marginBottom: '16px' }}>How would you rate our fraud prediction?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: 'accurate', label: '👍 Accurate', color: '#10b981' },
            { value: 'partially_accurate', label: '😐 Partially accurate', color: '#f59e0b' },
            { value: 'not_accurate', label: '👎 Not accurate', color: '#ef4444' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFeedbackData({ ...feedbackData, modelRating: option.value })}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '12px 16px',
                background: feedbackData.modelRating === option.value ? `linear-gradient(135deg, ${option.color}, ${option.color}dd)` : 'rgba(255, 255, 255, 0.05)',
                border: feedbackData.modelRating === option.value ? `2px solid ${option.color}` : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: feedbackData.modelRating === option.value ? 'white' : '#e5e7eb',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >{option.label}</button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'flex-end',
        padding: '30px 0',
        borderTop: '2px solid rgba(255, 255, 255, 0.2)',
        marginTop: '30px'
      }}>
        <button
          onClick={() => setCurrentPage('dashboard')}
          style={{
            padding: '12px 24px',
            background: 'rgba(156, 163, 175, 0.2)',
            border: '2px solid rgba(156, 163, 175, 0.3)',
            borderRadius: '8px',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >Cancel</button>
        <button
          onClick={async () => {
            // Validation
            if (!feedbackData.humanDecision) {
              alert('Please select whether the transaction is fraud or legit.');
              return;
            }
            if (!feedbackData.modelRating) {
              alert('Please rate the model prediction.');
              return;
            }

            try {
              const predictionId = displayResult?.prediction_id;
              if (!predictionId) {
                console.error('Feedback Error: Missing prediction_id in result', displayResult);
                throw new Error(`Technical Error: No prediction ID found. Please analyze a file first before submitting feedback.`);
              }
              if (predictionId === 'local-fallback') {
                throw new Error('Feedback is not available for local fallback analysis. Please ensure the backend is running.');
              }

              // Submit feedback to backend
              await fraudApi.submitFeedback({
                prediction_id: predictionId,
                human_decision: feedbackData.humanDecision,
                reasons: feedbackData.reasons || [],
                thoughts: feedbackData.thoughts || '',
                model_rating: feedbackData.modelRating
              });

              // Show success message
              const now = new Date();
              const formatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
              const successDiv = document.createElement('div');
              successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 24px;border-radius:12px;box-shadow:0 10px 30px rgba(16,185,129,0.4);z-index:10000;font-family:inherit;display:flex;align-items:center;gap:12px;';
              successDiv.innerHTML = `
                <div style="font-size: 24px;">✅</div>
                <div>
                  <div style="font-weight: bold; font-size: 16px;">Feedback Submitted</div>
                  <div style="font-size: 13px; opacity: 0.9;">Thank you for improving our model!</div>
                </div>
              `;
              document.body.appendChild(successDiv);
              setTimeout(() => successDiv.remove(), 3000);

              setFeedbackData({ ...feedbackData, isSubmitted: true, submissionTime: formatted });

              // Navigate back to dashboard after 2 seconds
              setTimeout(() => setCurrentPage('dashboard'), 2000);
            } catch (error) {
              console.error('Feedback submission error:', error);
              alert(error.message || 'Error submitting feedback. Please try again.');
            }
          }}
          disabled={!feedbackData.humanDecision || !feedbackData.modelRating}
          style={{
            padding: '16px 32px',
            background: (feedbackData.humanDecision && feedbackData.modelRating) ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(156, 163, 175, 0.2)',
            border: (feedbackData.humanDecision && feedbackData.modelRating) ? '2px solid #10b981' : '2px solid rgba(156, 163, 175, 0.3)',
            borderRadius: '12px',
            color: (feedbackData.humanDecision && feedbackData.modelRating) ? 'white' : '#9ca3af',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (feedbackData.humanDecision && feedbackData.modelRating) ? 'pointer' : 'not-allowed'
          }}
        >🚀 Submit Feedback</button>
      </div>
    </div>
  );
};

export default FeedbackPage;
