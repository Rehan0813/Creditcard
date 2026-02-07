import React from 'react';

/**
 * Full-page Fraud Analysis Report (same layout as How to Use / Model Evaluation).
 * NET background from VantaNetLayout shows through.
 */
const AnalysisReportPage = ({ result, setResult, setCurrentPage }) => {
  const goBackToDashboard = () => {
    setResult(null);
    setCurrentPage('dashboard');
  };

  if (!result) {
    return (
      <div style={{ padding: '40px', minHeight: '100%', background: 'transparent' }}>
        <button
          onClick={goBackToDashboard}
          style={{
            padding: '10px 20px',
            background: 'rgba(56, 189, 248, 0.3)',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '8px',
            color: '#e0f2fe',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
        >
          ← Back to Dashboard
        </button>
        <p style={{ color: '#9ca3af', fontSize: '18px' }}>No report data. Run an analysis from the dashboard first.</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      padding: '20px',
      minHeight: '100%',
      width: '100%',
      boxSizing: 'border-box',
      background: 'transparent'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        marginBottom: '20px'
      }}>
        <button
          onClick={goBackToDashboard}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 20px',
            background: 'rgba(56, 189, 248, 0.3)',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '8px',
            color: '#e0f2fe',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{
          fontSize: '42px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          textAlign: 'center',
          width: '100%',
          paddingTop: '50px'
        }}>
          Fraud Analysis Report
        </h1>

        <button
          onClick={() => setCurrentPage('feedback')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '260px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 25px rgba(168, 85, 247, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
          }}
        >
          📝 Submit Feedback
        </button>

        <button
          onClick={() => {
            const reportData = {
              title: 'Fraud Analysis Report',
              transactionId: result.transactionId,
              amount: result.amount,
              country: result.country,
              merchantCategory: result.merchantCategory,
              paymentMethod: result.paymentMethod,
              transactionTime: result.transactionTime,
              riskScore: result.score,
              riskLevel: result.riskLevel,
              recommendedAction: result.action,
              reasons: result.reasons,
              generatedAt: new Date().toISOString()
            };
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', `fraud-analysis-report-${result.transactionId}.json`);
            linkElement.click();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '40px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📥 Download Report
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: '20px 40px 40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {result.csvData && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>📁 Uploaded CSV Data</h2>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(59, 130, 246, 0.1)', borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                    {result.csvData.headers.map((header, index) => (
                      <th key={index} style={{ padding: '12px', textAlign: 'left', color: '#60a5fa', fontWeight: 'bold', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.csvData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: rowIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ padding: '10px 12px', color: '#e5e7eb', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Showing first {result.csvData.rows.length} transactions from uploaded CSV file</div>
          </div>
        )}

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>2️⃣ Transaction Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Transaction ID</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.transactionId}</div></div>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Amount</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.amount}</div></div>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Country</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.country}</div></div>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Merchant Category</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.merchantCategory}</div></div>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Payment Method</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.paymentMethod}</div></div>
            <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Transaction Time</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.transactionTime}</div></div>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>3️⃣ Model Prediction</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Fraud Risk Score</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>{result.score}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Risk Level</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>{result.riskEmoji} {result.riskLevel}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Recommended Action</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: result.action === 'Safe' ? '#10b981' : result.action === 'Verify' ? '#f59e0b' : '#ef4444' }}>{result.action}</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '14px', textAlign: 'center' }}>This is the AI's decision based on the transaction analysis.</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>4️⃣ Risk Explanation</h2>
          <div style={{ color: '#e5e7eb', fontSize: '16px', marginBottom: '16px' }}>Why was this transaction flagged?</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#e5e7eb', fontSize: '14px', lineHeight: '1.6' }}>
            {result.reasons.map((reason, index) => (<li key={index} style={{ marginBottom: '8px' }}>{reason}</li>))}
          </ul>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#22c55e', fontSize: '14px', textAlign: 'center' }}>This makes the prediction explainable and transparent.</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
