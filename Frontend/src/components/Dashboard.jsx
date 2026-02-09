import React, { useState, useEffect } from 'react';
import { fraudApi } from '../api/fraudApi';

const Dashboard = ({ result, setResult, setCurrentPage }) => {
  // Global state backup to prevent loss
  if (typeof window !== 'undefined') {
    window.dashboardState = window.dashboardState || {};
  }

  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [schemaError, setSchemaError] = useState(false);
  const [schemaValid, setSchemaValid] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState([]);
  const [feedbackData, setFeedbackData] = useState({
    humanDecision: '',
    reasons: [],
    thoughts: '',
    modelRating: '',
    isSubmitted: false,
    submissionTime: null
  });

  // Enhanced state setters that also save to global state
  const setFileWithBackup = (newFile) => {
    setFile(newFile);
    setFileId(null);
    setTransactions([]);
    setSelectedRowIndices([]);
    if (typeof window !== 'undefined') {
      window.dashboardState.file = newFile;
    }
  };

  const setSchemaValidWithBackup = (newSchemaValid) => {
    setSchemaValid(newSchemaValid);
    if (typeof window !== 'undefined') {
      window.dashboardState.schemaValid = newSchemaValid;
    }
  };
  const [activeModal, setActiveModal] = useState(null);

  // Clear any saved state on component mount to ensure clean start
  React.useEffect(() => {
    sessionStorage.removeItem('dashboardFile');
    sessionStorage.removeItem('dashboardSchemaValid');
    if (typeof window !== 'undefined' && window.dashboardState) {
      window.dashboardState.file = null;
      window.dashboardState.schemaValid = false;
    }
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        // First, set the file so it appears immediately
        setFileWithBackup(uploadedFile);
        setSchemaError(false);
        setSchemaValidWithBackup(false); // Reset to false until validation

        if (fileExtension === 'csv') {
          validateCsvSchema(uploadedFile);
        } else {
          // For XLSX files, we'll assume they're valid for now
          // In a real implementation, you'd parse XLSX and validate schema too
          setSchemaValidWithBackup(true);
        }
      } else {
        alert('Please upload a CSV or Excel file');
      }
    }
  };

  const validateCsvSchema = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          const requiredFields = [
            'amount',
            'transaction_time',
            'merchant_category',
            'country',
            'device_type',
            'payment_method'
          ];

          const missingFields = requiredFields.filter(field => !headers.includes(field));

          if (missingFields.length > 0) {
            setSchemaValidWithBackup(false);
            showSchemaPopup(missingFields);
            // Remove file after popup shows (3.5 seconds)
            setTimeout(() => {
              setFileWithBackup(null);
              setSchemaValidWithBackup(false);
            }, 3500);
          } else {
            setSchemaValidWithBackup(true);
          }
        }
      } catch (error) {
        console.error('Schema validation error:', error);
        // If there's an error reading the file, show a generic error
        showSchemaPopup(['Unable to read file format']);
        setTimeout(() => setFileWithBackup(null), 3500);
      }
    };
    reader.onerror = () => {
      console.error('File reading error');
      showSchemaPopup(['Unable to read file']);
      setTimeout(() => setFileWithBackup(null), 3500);
    };
    reader.readAsText(file);
  };

  const showSchemaPopup = (missingFields) => {
    // Remove any existing popup
    const existingPopup = document.getElementById('schema-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'schema-popup';
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.9));
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 6px 24px rgba(34, 197, 94, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 320px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideIn 0.3s ease-out;
    `;

    popup.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 18px; margin-right: 8px;">⚠️</div>
        <div style="font-size: 14px; font-weight: bold;">Upload Correct Schema</div>
      </div>
      <div style="margin-bottom: 10px; font-size: 12px; line-height: 1.4;">
        Missing required columns:
      </div>
      <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 10px;">
        ${missingFields.map(field => `<div style="margin: 2px 0; font-size: 11px;">• <strong>${field}</strong></div>`).join('')}
      </div>
      <div style="font-size: 11px; opacity: 0.9;">
        Download schema template for correct format
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      if (document.getElementById('schema-popup')) {
        popup.remove();
      }
    }, 3500);
  };

  const runAnalysisOnSelectedRows = async (overrideRowIndices = null, overrideFileId = null) => {
    const indices = overrideRowIndices != null ? overrideRowIndices : selectedRowIndices;
    const fid = overrideFileId != null ? overrideFileId : fileId;
    if (!fid || indices.length === 0) {
      alert('Please select at least one transaction to analyze.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const predictionResponse = await fraudApi.predictFromFile(fid, indices);
      const backendPredictions = predictionResponse.predictions || [];
      const firstPrediction = backendPredictions.length > 0 ? backendPredictions[0] : null;
      if (backendPredictions.length === 0) {
        throw new Error('No predictions generated for the selected rows.');
      }
      applyPredictionResult(backendPredictions, firstPrediction, indices, transactions);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyPredictionResult = (backendPredictions, firstPrediction, selectedIndices, transactionsList) => {
    sessionStorage.setItem('dashboardFile', JSON.stringify(file));
    sessionStorage.setItem('dashboardSchemaValid', JSON.stringify(schemaValid));

    const rl = firstPrediction.risk_level;
    const riskEmoji = rl === 'High' ? '🔴' : (rl === 'Medium' ? '🟡' : '🟢');

    const firstIdx = selectedIndices && selectedIndices.length > 0 ? selectedIndices[0] : 0;
    const tx = transactionsList && transactionsList[firstIdx] ? transactionsList[firstIdx] : null;

    setResult({
      score: (firstPrediction.fraud_score || 0).toFixed(2),
      riskLevel: rl,
      riskEmoji,
      action: firstPrediction.recommended_action,
      reasons: firstPrediction.reasons || [],
      prediction_id: firstPrediction.prediction_id,
      transactionId: tx ? `TXN-${firstPrediction.prediction_id}` : `TXN-${firstPrediction.prediction_id}`,
      amount: tx ? tx.amount : (firstPrediction.amount ?? 'Unknown'),
      country: tx ? tx.country : (firstPrediction.country ?? 'Unknown'),
      merchantCategory: tx ? tx.merchant_category : (firstPrediction.merchant_category ?? 'Unknown'),
      paymentMethod: tx ? tx.payment_method : (firstPrediction.payment_method ?? 'Unknown'),
      transactionTime: tx ? tx.transaction_time : (firstPrediction.transaction_time ?? new Date().toLocaleString()),
      allPredictions: backendPredictions.length > 1 ? backendPredictions : undefined,
      selectedIndices: selectedIndices,
      transactionsList: transactionsList
    });
    setCurrentPage('analysisreport');
  };

  const analyzeFile = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }
    setIsAnalyzing(true);
    try {
      const uploadResponse = await fraudApi.uploadFile(file);
      const fid = uploadResponse.file_id;
      setFileId(fid);
      const { transactions: txList } = await fraudApi.getFileTransactions(fid);
      setTransactions(txList || []);
      if (!txList || txList.length === 0) {
        throw new Error('No transactions found in this file.');
      }
      if (txList.length === 1) {
        setSelectedRowIndices([0]);
        await runAnalysisOnSelectedRows([0], fid);
        return;
      }
      setSelectedRowIndices([0]);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Upload or load failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateSchemaError = () => {
    setSchemaError(true);
    setResult(null);
  };

  const downloadSchema = () => {
    const schema = {
      required_fields: [
        "amount",
        "transaction_time",
        "merchant_category",
        "country",
        "device_type",
        "payment_method"
      ],
      optional_fields: [
        "channel",
        "merchant_country",
        "transaction_count_24h",
        "avg_amount_24h"
      ],
      description: "Upload your CSV/Excel file with these columns for accurate fraud detection",
      example_format: {
        amount: "125.50",
        transaction_time: "2024-01-15 14:30:00",
        merchant_category: "electronics",
        country: "US",
        device_type: "mobile",
        payment_method: "credit_card",
        channel: "online",
        merchant_country: "US",
        transaction_count_24h: 3,
        avg_amount_24h: 89.75
      }
    };

    const csvContent = Object.keys(schema.example_format).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_detection_schema.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (transactions.length > 1 && fileId) {
    return (
      <div style={{
        position: 'relative',
        minHeight: '100%',
        width: '100%',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'transparent'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => { setTransactions([]); setFileId(null); setSelectedRowIndices([]); }}
            style={{
              marginBottom: '20px',
              padding: '10px 18px',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ← Back to upload
          </button>
          <h2 style={{ color: '#f8fafc', fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>
            Select transactions to analyze
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
            Your file contains {transactions.length} transactions. Choose one or more, then run fraud detection.
          </p>
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: '320px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(51, 65, 85, 0.8)', borderBottom: '1px solid rgba(71, 85, 105, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Merchant</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Country</th>
                    <th style={{ padding: '12px', width: '80px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.row_index} style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.3)', background: selectedRowIndices.includes(tx.row_index) ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{tx.row_index + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{tx.amount || '–'}</td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(tx.transaction_time || '–').toString().slice(0, 16)}</td>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{tx.merchant_category || '–'}</td>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{tx.country || '–'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedRowIndices.includes(tx.row_index)}
                          onChange={() => {
                            setSelectedRowIndices((prev) =>
                              prev.includes(tx.row_index)
                                ? prev.filter((i) => i !== tx.row_index)
                                : [...prev, tx.row_index].sort((a, b) => a - b)
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button
            type="button"
            onClick={() => runAnalysisOnSelectedRows()}
            disabled={isAnalyzing || selectedRowIndices.length === 0}
            style={{
              padding: '12px 24px',
              background: selectedRowIndices.length > 0 && !isAnalyzing ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(71, 85, 105, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selectedRowIndices.length > 0 && !isAnalyzing ? 'pointer' : 'not-allowed'
            }}
          >
            {isAnalyzing ? 'Analyzing...' : `Analyze selected (${selectedRowIndices.length})`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      padding: '20px 20px 400px 20px',
      minHeight: '100%',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>

        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          textShadow: '0 0 30px rgba(96, 165, 250, 0.5)'
        }}>
          AI-Powered Fraud Risk Analysis
        </h1>
        <p style={{
          color: '#9ca3af',
          fontSize: '16px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          Advanced machine learning for real-time fraud detection and risk assessment
        </p>
      </div>

      {/* How to Use and Model Evaluation Section - Top Right */}
      <div style={{
        position: 'fixed',
        top: '50px',
        right: '20px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={() => setCurrentPage('howtouse')}
          style={{
            padding: '8px 16px',
            background: 'rgba(56, 189, 248, 0.3)',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '10px',
            color: '#e0f2fe',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.45)';
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
            e.target.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.45)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.3)';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.35)';
          }}
        >
          📖 How to use?
        </button>
        <button
          onClick={() => setCurrentPage('modelevaluation')}
          style={{
            padding: '8px 16px',
            background: 'rgba(56, 189, 248, 0.3)',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '10px',
            color: '#e0f2fe',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.45)';
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
            e.target.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.45)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.3)';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.35)';
          }}
        >
          📊 Model Evaluation & Accuracy Calculation
        </button>
      </div>

      {/* Process Steps - Full Width Equal Spacing */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '20px',
        width: '100%'
      }}>
        <div style={{
          flex: '1 1 240px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.3))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '2px solid rgba(139, 92, 246, 0.6)',
          textAlign: 'center',
          minWidth: 0,
          boxSizing: 'border-box',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5), 0 0 60px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s ease'
        }}>
          {/* Subtle animated background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            fontSize: '40px',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.8))',
            transform: 'scale(1)',
            transition: 'transform 0.3s ease'
          }}>📊</div>
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(139, 92, 246, 0.5)'
          }}>1️⃣ Upload Data</h3>
          <p style={{
            color: '#e0e7ff',
            fontSize: '13px',
            position: 'relative',
            zIndex: 1
          }}>CSV or Excel files</p>
        </div>

        <div style={{
          flex: '1 1 240px',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.3))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '2px solid rgba(236, 72, 153, 0.6)',
          textAlign: 'center',
          minWidth: 0,
          boxSizing: 'border-box',
          boxShadow: '0 8px 32px rgba(236, 72, 153, 0.5), 0 0 60px rgba(219, 39, 119, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s ease'
        }}>
          {/* Subtle animated background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite 2s',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            fontSize: '40px',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 0 25px rgba(236, 72, 153, 0.8))',
            transform: 'scale(1)',
            transition: 'transform 0.3s ease'
          }}>🤖</div>
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(236, 72, 153, 0.5)'
          }}>2️⃣ ML Analysis</h3>
          <p style={{
            color: '#fce7f3',
            fontSize: '13px',
            position: 'relative',
            zIndex: 1
          }}>XGBoost patterns</p>
        </div>

        <div style={{
          flex: '1 1 240px',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(13, 148, 136, 0.3))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '2px solid rgba(20, 184, 166, 0.6)',
          textAlign: 'center',
          minWidth: 0,
          boxSizing: 'border-box',
          boxShadow: '0 8px 32px rgba(20, 184, 166, 0.5), 0 0 60px rgba(13, 148, 136, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s ease'
        }}>
          {/* Subtle animated background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(20, 184, 166, 0.3) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite 4s',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            fontSize: '40px',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 0 25px rgba(20, 184, 166, 0.8))',
            transform: 'scale(1)',
            transition: 'transform 0.3s ease'
          }}>📈</div>
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(20, 184, 166, 0.5)'
          }}>3️⃣ Risk Score</h3>
          <p style={{
            color: '#ccfbf1',
            fontSize: '13px',
            position: 'relative',
            zIndex: 1
          }}>Get recommendations</p>
        </div>
      </div>

      {/* Upload Section - slightly lower, narrower, warm purple-slate background */}
      <div style={{
        background: 'linear-gradient(160deg, rgba(51, 41, 72, 0.92) 0%, rgba(30, 27, 45, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '24px 24px 24px',
        textAlign: 'center',
        maxWidth: '450px',
        margin: '11px auto 140px auto',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        boxShadow: '0 8px 32px rgba(30, 27, 45, 0.6), 0 0 40px rgba(139, 92, 246, 0.1)',
        position: 'relative',
        overflow: 'visible'
      }}>

        <h2 style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #a855f7, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          transform: 'translateY(-16px)',
          filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))'
        }}>📤 Upload Transaction Data</h2>

        <div style={{
          borderRadius: '12px',
          padding: '20px 24px 24px',
          marginBottom: '0',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'visible'
        }}>

          <div style={{
            fontSize: '32px',
            marginBottom: '6px',
            marginTop: '-12px',
            opacity: 0.8,
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 0 20px rgba(167, 139, 250, 0.5))'
          }}>📁</div>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            style={{
              display: 'none'
            }}
            id="file-upload"
          />

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
            alignItems: 'center',
            marginTop: '-4px'
          }}>
            <button
              onClick={() => document.getElementById('file-upload').click()}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(168, 85, 247, 0.4)',
                boxShadow: '0 6px 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(244, 114, 182, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 8px 30px rgba(168, 85, 247, 0.7), 0 0 60px rgba(244, 114, 182, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(244, 114, 182, 0.3)';
              }}
            >
              📤 Upload CSV
            </button>

            <button
              onClick={() => document.getElementById('file-upload').click()}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(251, 146, 60, 0.4)',
                boxShadow: '0 6px 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 8px 30px rgba(251, 146, 60, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)';
              }}
            >
              📊 Upload XLSX
            </button>
            <button
              onClick={() => setCurrentPage && setCurrentPage('manualform')}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(248, 113, 113, 0.5)',
                boxShadow: '0 6px 20px rgba(248, 113, 113, 0.6), 0 0 40px rgba(248, 113, 113, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 8px 30px rgba(248, 113, 113, 0.8), 0 0 60px rgba(248, 113, 113, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(248, 113, 113, 0.6), 0 0 40px rgba(248, 113, 113, 0.3)';
              }}
            >
              ✍️ Fill Transaction Form
            </button>
          </div>

          {file && schemaValid && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 3px 10px rgba(34, 197, 94, 0.2)'
            }}>
              <span style={{ marginBottom: '2px' }}>✅ {file.name}</span>
              <span style={{ fontSize: '10px', color: '#16a34a' }}>File validated successfully! Click Analyze button below.</span>
            </div>
          )}

          {/* Analyze Fraud Detection Button - show when file is valid and transactions not yet loaded */}
          {file && schemaValid && transactions.length <= 1 && (
            <div style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: '0',
              paddingBottom: '12px',
              position: 'relative'
            }}>
              <button
                onClick={analyzeFile}
                style={{
                  display: 'inline-block',
                  padding: '12px 22px',
                  background: isAnalyzing
                    ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  borderRadius: '10px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(220, 38, 38, 0.3)',
                  boxShadow: isAnalyzing
                    ? '0 3px 12px rgba(156, 163, 175, 0.3)'
                    : '0 4px 20px rgba(220, 38, 38, 0.4)',
                  position: 'relative',
                  overflow: 'visible',
                  opacity: isAnalyzing ? 0.7 : 1,
                  maxWidth: '90%',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => {
                  if (!isAnalyzing) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 25px rgba(220, 38, 38, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isAnalyzing) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.4)';
                  }
                }}
              >
                {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze Fraud Detection'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback and Review Button - Top Left */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 30
      }}>
        <button
          onClick={() => result ? setCurrentPage('feedback') : alert('Please analyze a file first before submitting feedback.')}
          disabled={!result}
          style={{
            padding: '8px 16px',
            background: result ? 'rgba(56, 189, 248, 0.3)' : 'rgba(107, 114, 128, 0.2)',
            border: result ? '2px solid rgba(56, 189, 248, 0.6)' : '2px solid rgba(107, 114, 128, 0.3)',
            borderRadius: '10px',
            color: result ? '#e0f2fe' : '#9ca3af',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: result ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: result ? '0 4px 20px rgba(56, 189, 248, 0.35)' : '0 2px 10px rgba(107, 114, 128, 0.2)',
            opacity: result ? 1 : 0.6
          }}
          onMouseOver={(e) => {
            if (result) {
              e.target.style.background = 'rgba(56, 189, 248, 0.45)';
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.45)';
            }
          }}
          onMouseOut={(e) => {
            if (result) {
              e.target.style.background = 'rgba(56, 189, 248, 0.3)';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.35)';
            }
          }}
        >
          📝 Feedback and Review
        </button>
      </div>

      {/* Key Features - Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 20,
        background: 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>⭐ Key Features</h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {[
            { icon: '📊', text: 'Fraud Risk Score (0–1)', color: '#3b82f6' },
            { icon: '⚠️', text: 'Risk Levels: Low / Medium / High', color: '#f59e0b' },
            { icon: '🔍', text: 'Explainable Risk Signals', color: '#8b5cf6' },
            { icon: '📁', text: 'Batch CSV Analysis (10k+ rows)', color: '#10b981' },
            { icon: '🎯', text: 'Single Transaction Analysis', color: '#ef4444' },
            { icon: '🤖', text: 'XGBoost Pipeline', color: '#06b6d4' },
            { icon: '🔧', text: 'Optional Column Support', color: '#84cc16' },
            { icon: '👥', text: 'Human-in-the-Loop Ready', color: '#a855f7' },
            { icon: '⚡', text: 'Real-time Predictions', color: '#f97316' }
          ].map((feature, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e5e7eb',
              fontSize: '12px',
              padding: '3px 0',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${feature.color}20`;
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}>
              <span style={{
                fontSize: '14px',
                filter: `drop-shadow(0 0 4px ${feature.color}40)`
              }}>{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schema Download - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 20,
        background: 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        maxWidth: '320px'
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '14px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>📋 Schema Requirements</h3>

        <div style={{
          marginBottom: '14px'
        }}>
          <div style={{
            color: '#9ca3af',
            fontSize: '12px',
            marginBottom: '8px',
            fontWeight: '600'
          }}>Required Fields:</div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            {['amount', 'transaction_time', 'merchant_category', 'country', 'device_type', 'payment_method'].map((field, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '8px' }}>●</span>
                {field}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginBottom: '14px'
        }}>
          <div style={{
            color: '#9ca3af',
            fontSize: '12px',
            marginBottom: '8px',
            fontWeight: '600'
          }}>Optional Fields:</div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            {['channel', 'merchant_country', 'transaction_count_24h', 'avg_amount_24h'].map((field, index) => (
              <div key={index} style={{
                color: '#f59e0b',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '8px' }}>○</span>
                {field}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={downloadSchema}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            border: 'none',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 10px rgba(16, 185, 129, 0.3)';
          }}
        >
          📥 Download Schema
        </button>
      </div>

      {/* Schema Error Message */}
      {schemaError && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            color: '#ef4444',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ Upload Failed – Schema Mismatch
          </h3>
          <p style={{
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '12px'
          }}>
            Your CSV file does not match the required schema.
          </p>
          <p style={{
            color: '#fbbf24',
            fontSize: '13px',
            marginBottom: '12px'
          }}>
            Please follow our requested schema, update the column names accordingly,
            and re-upload the file.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>✔ Clear guidance</span>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>✔ Safe predictions</span>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>✔ No silent errors</span>
          </div>
        </div>
      )}

      {/* Fraud Analysis Report - Full Screen Overlay */}
      {showAnalysisReport && result && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          zIndex: 1000,
          overflow: 'auto',
          paddingBottom: '120px' // Increased clearance for footer
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 40px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 10
          }}>
            <button
              onClick={() => setShowAnalysisReport(false)}
              style={{
                position: 'absolute',
                left: '20px',
                top: '22px',
                background: 'rgba(236, 72, 153, 0.1)',
                border: '2px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(236, 72, 153, 0.2)';
                e.target.style.transform = 'translateX(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(236, 72, 153, 0.1)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              ← Back to Dashboard
            </button>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #60a5fa 0%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              textShadow: '0 0 30px rgba(96, 165, 250, 0.3)'
            }}>
              Fraud Analysis Report
            </h1>
          </div>

          <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
            {/* Uploaded CSV Data Card */}
            {result.csvData && (
              <div style={{
                backgroundColor: 'rgba(236, 72, 153, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(236, 72, 153, 0.7)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
              }}>

                <h2 style={{
                  color: 'white',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '28px' }}>📂</span> Uploaded CSV Data
                </h2>
                <div style={{
                  overflowX: 'auto',
                  borderRadius: '12px',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  background: 'rgba(236, 72, 153, 0.85)',

                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(236, 72, 153, 1)', borderBottom: '2px solid rgba(236, 72, 153, 0.6)' }}>
                        {result.csvData.headers.map((header, idx) => (
                          <th key={idx} style={{ padding: '14px', textAlign: 'left', color: 'white', fontWeight: 'bold' }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.csvData.rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent' }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '12px 14px', color: '#e5e7eb' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transaction Summary & Risk Assessment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
              {/* Summary Card */}
              <div style={{
                backgroundColor: 'rgba(236, 72, 153, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(236, 72, 153, 0.7)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>Transaction Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ color: 'white', opacity: 0.8, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</label>
                    <p style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: '4px 0' }}>{result.amount}</p>
                  </div>
                  <div>
                    <label style={{ color: 'white', opacity: 0.8, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Country</label>
                    <p style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: '4px 0' }}>{result.country}</p>
                  </div>
                  <div>
                    <label style={{ color: 'white', opacity: 0.8, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</label>
                    <p style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '4px 0' }}>{result.merchantCategory}</p>
                  </div>
                  <div>
                    <label style={{ color: 'white', opacity: 0.8, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</label>
                    <p style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '4px 0' }}>{result.transactionTime}</p>
                  </div>
                </div>
              </div>

              {/* Assessment Card */}
              <div style={{
                backgroundColor: 'rgba(236, 72, 153, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                border: `2px solid ${result.riskLevel === 'High' ? '#f43f5e' : result.riskLevel === 'Medium' ? '#fbbf24' : '#10b981'}`,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>Risk Assessment</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '48px' }}>{result.riskEmoji}</span>
                  <div>
                    <p style={{
                      color: result.riskLevel === 'High' ? '#fecaca' : result.riskLevel === 'Medium' ? '#fde68a' : '#d1fae5',
                      fontSize: '32px',
                      fontWeight: '900',
                      margin: 0
                    }}>{result.riskLevel} Risk</p>
                    <p style={{ color: 'white', opacity: 0.9, margin: 0 }}>Model Confidence: {(result.score * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
                    <strong>Final Recommendation:</strong> <span style={{ color: 'white', fontWeight: 'bold' }}>{result.action}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Indicators Card */}
            <div style={{
              backgroundColor: 'rgba(236, 72, 153, 0.95)',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid rgba(236, 72, 153, 0.7)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🧠</span> Explainable Risk Indicators
              </h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {result.reasons.map((reason, idx) => (
                  <div key={idx} style={{
                    color: 'white',
                    padding: '16px 20px',
                    background: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ color: 'white', fontSize: '20px' }}>•</span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideBeam {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
