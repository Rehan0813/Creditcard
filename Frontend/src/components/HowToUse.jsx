import React, { useState, useEffect } from 'react';

const HowToUse = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    {
      title: "Download the Schema Template",
      icon: "📥",
      color: "#60a5fa"
    },
    {
      title: "Prepare Your Transaction Data",
      icon: "📝",
      color: "#a78bfa"
    },
    {
      title: "Upload the CSV File",
      icon: "📤",
      color: "#f59e0b"
    },
    {
      title: "AI-Based Fraud Analysis",
      icon: "🤖",
      color: "#10b981"
    },
    {
      title: "View Results",
      icon: "📊",
      color: "#ef4444"
    },
    {
      title: "Take Action",
      icon: "⚡",
      color: "#8b5cf6"
    }
  ];

  return (
    <div style={{
      position: 'relative',
      padding: '20px',
      minHeight: '100%',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent'
    }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          animation: isVisible ? 'slideInDown 0.8s ease-out' : 'none'
        }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            textShadow: '0 0 30px rgba(96, 165, 250, 0.5)'
          }}>
            How to Use Fraud Detection System
          </h1>
          <p style={{
            color: '#9ca3af',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Follow these simple steps to analyze transactions for fraud detection
          </p>
        </div>

        {/* Back Button */}
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

        {/* Steps Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 40px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.1}s both` : 'none',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
              {/* Step Number */}
              <div style={{
                position: 'absolute',
                top: index === 0 ? '12px' : '20px',
                left: '20px',
                width: '40px',
                height: '40px',
                background: `linear-gradient(135deg, ${step.color}, ${step.color}88)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: `0 4px 12px ${step.color}40`
              }}>
                {index + 1}
              </div>

              {/* Icon */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '32px',
                filter: `drop-shadow(0 0 20px ${step.color}60)`,
                opacity: 0.8
              }}>
                {step.icon}
              </div>

              {/* Content */}
              <div style={{
                marginLeft: '60px',
                marginRight: '60px',
                textAlign: 'left'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: index === 0 ? '6px' : '12px',
                  marginTop: index === 0 ? '-6px' : '0px',
                  background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'white',
                  textAlign: 'left',
                  filter: index === 1 ? 'drop-shadow(0 0 1px rgba(167, 139, 250, 0.8))' : 'none'
                }}>
                  {step.title}
                </h2>
                

                {step.details && (
                  <div style={{
                    background: 'rgba(167, 139, 250, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '12px',
                    textAlign: 'left',
                    border: '1px solid rgba(167, 139, 250, 0.15)'
                  }}>
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} style={{
                        color: '#e5e7eb',
                        fontSize: '13px',
                        marginBottom: '6px',
                        paddingLeft: '20px',
                        position: 'relative',
                        lineHeight: '1.4',
                        textAlign: 'left'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: '0',
                          color: step.color,
                          fontSize: '12px'
                        }}>
                          •
                        </span>
                        {detail}
                      </div>
                    ))}
                  </div>
                )}

                {step.note && (
                  <div style={{
                    background: `${step.color}20`,
                    border: `1px solid ${step.color}40`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginTop: '12px',
                    color: step.color,
                    fontSize: '12px',
                    fontStyle: 'italic',
                    textAlign: 'left'
                  }}>
                    💡 {step.note}
                  </div>
                )}
              </div>

              {/* Animated Border Effect */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                animation: 'slideBorder 3s ease-in-out infinite'
              }}></div>
            </div>
          ))}
        </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          33% { transform: translateY(-20px) rotate(120deg); opacity: 0.8; }
          66% { transform: translateY(10px) rotate(240deg); opacity: 0.4; }
        }
        
        @keyframes slideBeam {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          50% { transform: translateY(0%); opacity: 1; }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
      `}</style>
      </div>
  );
};

export default HowToUse;
