import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Full-page Fraud Analysis Report (same layout as How to Use / Model Evaluation).
 * NET background from VantaNetLayout shows through.
 */
const AnalysisReportPage = ({ result, setResult, setCurrentPage }) => {
  const goBackToDashboard = () => {
    setResult(null);
    setCurrentPage('dashboard');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Helper to add centered title
    const addTitle = (text, size = 18, color = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, currentY);
      currentY += size / 2 + 5;
    };

    // Helper for section headers
    const addSectionHeader = (text) => {
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.setFont('helvetica', 'bold');
      doc.text(text, 15, currentY);
      currentY += 10;
    };

    // 0. Report Header
    doc.setFillColor(15, 23, 42); // Dark background for header
    doc.rect(0, 0, pageWidth, 40, 'F');
    currentY = 25;
    addTitle('FRAUD ANALYSIS REPORT', 22, [255, 255, 255]);
    currentY = 50;

    // 1. Transaction Summary
    addSectionHeader('1. Transaction Summary');
    const isBatch = result?.allPredictions && result.allPredictions.length > 1;

    if (isBatch && result.selectedIndices?.length) {
      const rows = result.selectedIndices.map((idx, i) => {
        const tx = result.transactionsList[idx] || {};
        return [
          i + 1,
          tx.amount || '–',
          tx.country || '–',
          tx.merchant_category || '–',
          tx.payment_method || '–',
          (tx.transaction_time || '–').toString().slice(0, 16)
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Amount', 'Country', 'Category', 'Method', 'Time']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Blue-500
        margin: { left: 15, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      const summaryData = [
        ['Transaction ID', result.transactionId || '–'],
        ['Amount', result.amount || '–'],
        ['Country', result.country || '–'],
        ['Merchant Category', result.merchantCategory || '–'],
        ['Payment Method', result.paymentMethod || '–'],
        ['Transaction Time', result.transactionTime || '–']
      ];
      autoTable(doc, {
        startY: currentY,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } },
        margin: { left: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // New page if needed
    if (currentY > 230) { doc.addPage(); currentY = 20; }

    // 3. Model Prediction
    addSectionHeader('3. Model Prediction');
    const displayScoreVal = isBatch ? Math.max(...result.allPredictions.map(p => p.fraud_score || 0)).toFixed(2) : result.score;
    const displayLevelVal = isBatch ? (displayScoreVal < 0.3 ? 'Low' : displayScoreVal < 0.7 ? 'Medium' : 'High') : result.riskLevel;
    const displayActionVal = isBatch ? (displayScoreVal < 0.3 ? 'Safe' : displayScoreVal < 0.7 ? 'Verify' : 'Block') : result.action;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fraud Risk Score: `, 20, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${displayScoreVal}`, 60, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Risk Level: `, 20, currentY);
    doc.setFont('helvetica', 'bold');
    const levelColor = displayLevelVal === 'Low' ? [16, 185, 129] : displayLevelVal === 'High' ? [239, 68, 68] : [245, 158, 11];
    doc.setTextColor(...levelColor);
    doc.text(`${displayLevelVal}`, 60, currentY);
    currentY += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Recommended Action: `, 20, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...levelColor);
    doc.text(`${displayActionVal}`, 65, currentY);
    currentY += 12;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'italic');
    doc.text("This is the AI's decision based on the transaction analysis.", 20, currentY);
    currentY += 15;

    // 4. Risk Explanation
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    addSectionHeader('4. Risk Explanation');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(isBatch ? 'Why was this batch flagged?' : 'Why was this transaction flagged?', 20, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    const reasonsList = (isBatch && result.allPredictions[0]?.reasons) || result.reasons || [];
    reasonsList.forEach(reason => {
      const splitReason = doc.splitTextToSize(`- ${reason}`, pageWidth - 40);
      doc.text(splitReason, 25, currentY);
      currentY += (splitReason.length * 6);
    });

    currentY += 10;
    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(15, currentY, pageWidth - 30, 10, 'F');
    doc.setTextColor(22, 163, 74); // Green-600
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("This makes the prediction explainable and transparent.", pageWidth / 2, currentY + 6.5, { align: 'center' });

    // Footer
    const dateStr = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${dateStr}`, 15, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Report ID: ${result.transactionId || 'BATCH-' + Date.now()}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });

    doc.save(`fraud-analysis-report-${result.transactionId || 'batch'}.pdf`);
  };

  const isBatch = result?.allPredictions && result.allPredictions.length > 1;
  const overallScore = isBatch
    ? Math.max(...result.allPredictions.map((p) => p.fraud_score ?? 0))
    : null;
  const getRiskFromScore = (s) => {
    if (s < 0.3) return { level: 'Low', emoji: '🟢', action: 'Safe' };
    if (s < 0.7) return { level: 'Medium', emoji: '🟡', action: 'Verify' };
    return { level: 'High', emoji: '🔴', action: 'Block' };
  };
  const batchRisk = overallScore != null ? getRiskFromScore(overallScore) : null;
  const displayScore = isBatch && overallScore != null ? overallScore.toFixed(2) : result?.score;
  const displayLevel = isBatch && batchRisk ? batchRisk.level : result?.riskLevel;
  const displayEmoji = isBatch && batchRisk ? batchRisk.emoji : result?.riskEmoji;
  const displayAction = isBatch && batchRisk ? batchRisk.action : result?.action;
  const highestRiskPrediction = isBatch && result.allPredictions?.length
    ? result.allPredictions.reduce((a, b) => ((a.fraud_score ?? 0) >= (b.fraud_score ?? 0) ? a : b))
    : null;
  const displayReasons = isBatch && highestRiskPrediction?.reasons ? highestRiskPrediction.reasons : result?.reasons || [];
  const selectedTransactions = isBatch && result.transactionsList && result.selectedIndices?.length
    ? result.selectedIndices.map((idx) => result.transactionsList[idx]).filter(Boolean)
    : [];

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
          id="back-btn"
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
          id="feedback-btn"
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
          id="download-btn"
          onClick={handleDownloadPDF}
          style={{
            position: 'absolute',
            top: '20px',
            right: '40px',
            padding: '10px 10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📥 Download Report (PDF)
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
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>1️⃣ Transaction Summary</h2>
          {isBatch && selectedTransactions.length > 0 ? (
            <>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>Analyzed {selectedTransactions.length} transactions.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>#</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Country</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Merchant Category</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Payment Method</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Transaction Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransactions.map((tx, i) => (
                      <tr key={tx.row_index ?? i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>{i + 1}</td>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>{tx.amount ?? '–'}</td>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>{tx.country ?? '–'}</td>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>{tx.merchant_category ?? '–'}</td>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>{tx.payment_method ?? '–'}</td>
                        <td style={{ padding: '10px', color: '#cbd5e1' }}>{(tx.transaction_time ?? '–').toString().slice(0, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Transaction ID</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.transactionId}</div></div>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Amount</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.amount}</div></div>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Country</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.country}</div></div>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Merchant Category</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.merchantCategory}</div></div>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Payment Method</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.paymentMethod}</div></div>
              <div style={{ color: '#e5e7eb' }}><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Transaction Time</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{result.transactionTime}</div></div>
            </div>
          )}
        </div>

        {result.allPredictions && result.allPredictions.length > 1 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>2️⃣ Per-transaction risk</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>#</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Risk score</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Level</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allPredictions.map((p, i) => (
                    <tr key={p.prediction_id || i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '10px', color: '#e2e8f0' }}>{i + 1}</td>
                      <td style={{ padding: '10px', color: '#e2e8f0' }}>{(p.fraud_score ?? 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', color: '#e2e8f0' }}>{p.risk_level ?? '–'}</td>
                      <td style={{ padding: '10px', color: p.recommended_action === 'Safe' ? '#10b981' : p.recommended_action === 'Block' ? '#ef4444' : '#f59e0b' }}>{p.recommended_action ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>3️⃣ Model Prediction</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Fraud Risk Score</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>{displayScore}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Risk Level</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>{displayEmoji} {displayLevel}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Recommended Action</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: displayAction === 'Safe' ? '#10b981' : displayAction === 'Verify' ? '#f59e0b' : '#ef4444' }}>{displayAction}</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '14px', textAlign: 'center' }}>
            {isBatch
              ? `Overall batch risk (highest of ${result.allPredictions.length} transactions). The score above reflects the maximum risk in the batch.`
              : 'This is the AI\'s decision based on the transaction analysis.'}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>4️⃣ Risk Explanation</h2>
          <div style={{ color: '#e5e7eb', fontSize: '16px', marginBottom: '16px' }}>{isBatch ? 'Why was this batch flagged?' : 'Why was this transaction flagged?'}</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#e5e7eb', fontSize: '14px', lineHeight: '1.6' }}>
            {(displayReasons.length ? displayReasons : result.reasons || []).map((reason, index) => (<li key={index} style={{ marginBottom: '8px' }}>{reason}</li>))}
          </ul>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#22c55e', fontSize: '14px', textAlign: 'center' }}>This makes the prediction explainable and transparent.</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
