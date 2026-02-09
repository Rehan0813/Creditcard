import React, { useState, useEffect } from 'react';

const ModelEvaluation = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sections = [
    {
      title: "🔍 How Accuracy Is Calculated",
      icon: "🔍",
      color: "#60a5fa",
      points: [
        "Model evaluated using unseen test data compared with actual labels",
        "Accuracy = Percentage of correct predictions, additional metrics needed for imbalanced data"
      ]
    },
    {
      title: "📊 Key Performance Metrics",
      icon: "📊", 
      color: "#a78bfa",
      points: [
        "Precision: Correct fraud predictions ÷ Total fraud predictions",
        "Recall: Detected frauds ÷ Total real frauds, F1-Score combines both metrics"
      ]
    },
    {
      title: "⚖️ Threshold-Based Evaluation",
      icon: "⚖️",
      color: "#f59e0b", 
      points: [
        "Model outputs fraud risk probability (0–1), threshold applied (e.g., 0.4 or 0.5)",
        "Risk ≥ threshold → Flagged as fraud, Risk < threshold → Considered safe, threshold chosen based on business needs"
      ]
    },
    {
      title: "🤖 Models Used in System",
      icon: "🤖",
      color: "#10b981",
      points: [
        "Logistic Regression: Baseline model for reference performance",
        "XGBoost Classifier: Primary production model handling complex patterns and imbalanced data"
      ]
    }
  ];

  return (
    <div style={{
      position: 'relative',
      padding: '20px 20px 150px 20px',
      minHeight: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginBottom: '20px',
        marginTop: '-20px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 30px rgba(96, 165, 250, 0.3)'
        }}>
          Model Evaluation & Accuracy Calculation
        </h1>
        
        <button
          onClick={() => {
            const event = new CustomEvent('navigateToDashboard');
            window.dispatchEvent(event);
          }}
          style={{
            position: 'fixed',
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
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 30,
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.45)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 24px rgba(56, 189, 248, 0.45)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.3)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.35)';
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Content Sections - Perfect Grid Layout */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto 20px auto',
        width: '100%',
        boxSizing: 'border-box',
        paddingTop: '20px'
      }}>
        {sections.map((section, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              backdropFilter: 'blur(15px)',
              borderRadius: '20px',
              padding: '24px',
              border: `2px solid ${section.color}30`,
              boxShadow: `0 10px 40px ${section.color}20`,
              position: 'relative',
              overflow: 'hidden',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.1}s both` : 'none',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 15px 50px ${section.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 10px 40px ${section.color}20`;
            }}
          >
            {/* Header with Icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: `linear-gradient(135deg, ${section.color}, ${section.color}88)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: `0 6px 20px ${section.color}40`,
                flexShrink: 0
              }}>
                {section.icon}
              </div>
              
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.2',
                flex: 1
              }}>
                {section.title}
              </h2>
            </div>

            {/* Content Points */}
            <div style={{
              background: `rgba(${section.color === '#60a5fa' ? '96, 165, 250' : section.color === '#a78bfa' ? '167, 139, 250' : section.color === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.08)`,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${section.color}25`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {section.points.map((point, pointIndex) => (
                <div key={pointIndex} style={{
                  color: '#e5e7eb',
                  fontSize: '13px',
                  marginBottom: pointIndex < section.points.length - 1 ? '8px' : '0',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    top: '6px',
                    color: section.color,
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    •
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* Animated Border Effect */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${section.color}, transparent)`,
              animation: 'slideBorder 3s ease-in-out infinite'
            }}></div>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideBorder {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Custom Scrollbar Styles */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.4);
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.6);
        }

        ::-webkit-scrollbar-thumb:active {
          background: rgba(59, 130, 246, 0.8);
        }
      `}</style>
    </div>
  );
};

export default ModelEvaluation;