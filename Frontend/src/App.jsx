import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import HowToUse from './components/HowToUse';
import ModelEvaluation from './components/ModelEvaluation';
import FeedbackPage from './components/FeedbackPage';
import AnalysisReportPage from './components/AnalysisReportPage';
import VantaNetLayout from './components/VantaNetLayout';
import ManualFormPage from './components/ManualFormPage';
import ReportPage from './components/ReportPage';
import { fraudApi } from './api/fraudApi';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [result, setResult] = useState(null); // Lifted so Feedback & Analysis Report pages can use it
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToDashboard = () => {
      setCurrentPage('dashboard');
    };

    window.addEventListener('navigateToDashboard', handleNavigateToDashboard);
    return () => {
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
    };
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Clear the other field if email or phone is being filled
      if (field === 'email' && value) {
        newData.phone = '';
      } else if (field === 'phone' && value) {
        newData.email = '';
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: require either email or phone, but not both
    if (!formData.email && !formData.phone) {
      alert('Please enter either email or phone number');
      return;
    }

    if (formData.email && formData.phone) {
      alert('Please enter either email OR phone number, not both');
      return;
    }

    if (!isLogin && !formData.name) {
      alert('Please enter your full name');
      return;
    }

    if (!formData.password) {
      alert('Please enter a password');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (isLogin) {
      // Login with backend API
      const identifier = formData.email || formData.phone;

      if (!identifier) {
        alert('Please enter email or phone number.');
        return;
      }

      if (!formData.password) {
        alert('Please enter password.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loginData = formData.email
          ? { email: formData.email, password: formData.password }
          : { phone: formData.phone, password: formData.password };

        const response = await fraudApi.login(loginData);

        // Show success message
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 15px rgba(16, 185, 129, 0.3);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        `;
        popup.textContent = 'Login successful!';

        const mainContainer = document.querySelector('[style*="max-width: 480px"]');
        if (mainContainer) {
          mainContainer.style.position = 'relative';
          mainContainer.appendChild(popup);
        } else {
          document.body.appendChild(popup);
        }

        setTimeout(() => {
          popup.remove();
          setIsLoggedIn(true);
        }, 2000);
      } catch (err) {
        setError(err.message);
        alert(err.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Signup with backend API
      if (!formData.name) {
        alert('Please enter your full name.');
        return;
      }

      const identifier = formData.email || formData.phone;

      if (!identifier) {
        alert('Please enter email or phone number.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const signupData = {
          name: formData.name,
          password: formData.password
        };

        if (formData.email) {
          signupData.email = formData.email;
        } else {
          signupData.phone = formData.phone;
        }

        const response = await fraudApi.signup(signupData);

        // Store token and user info
        if (response.access_token) {
          localStorage.setItem('auth_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        alert(`Sign Up successful! User ${response.user.name} has been registered. You can now login.`);

        // Switch to login mode
        setIsLogin(true);

        // Clear form
        setFormData({
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          name: ''
        });
      } catch (err) {
        setError(err.message);
        alert(err.message || 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Single layout so NET stays visible when switching pages (How to Use, Feedback, Review, etc.)
  if (isLoggedIn) {
    const renderPage = () => {
      if (currentPage === 'howtouse') return <HowToUse />;
      if (currentPage === 'modelevaluation') return <ModelEvaluation />;
      if (currentPage === 'manualform') {
        return <ManualFormPage setCurrentPage={setCurrentPage} setResult={setResult} />;
      }
      if (currentPage === 'feedback') return <FeedbackPage result={result} setCurrentPage={setCurrentPage} />;
      if (currentPage === 'report') return <ReportPage result={result} setCurrentPage={setCurrentPage} />;
      if (currentPage === 'analysisreport') return <AnalysisReportPage result={result} setResult={setResult} setCurrentPage={setCurrentPage} />;
      return <Dashboard result={result} setResult={setResult} setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
    };
    return <VantaNetLayout>{renderPage()}</VantaNetLayout>;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Enhanced Animated Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)'
      }}>
        {/* Multiple moving gradient waves */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.08), transparent, rgba(139, 92, 246, 0.06), transparent)',
          animation: 'wave1 20s linear infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.05), transparent, rgba(34, 197, 94, 0.04), transparent)',
          animation: 'wave2 25s linear infinite reverse'
        }}></div>

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          height: '100%',
          background: 'linear-gradient(45deg, transparent, rgba(251, 146, 60, 0.03), transparent, rgba(147, 51, 234, 0.03), transparent)',
          animation: 'wave3 30s linear infinite'
        }}></div>

        {/* Floating orbs with enhanced movements */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 30%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'orb1 15s ease-in-out infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '25%',
          right: '15%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(45px)',
          animation: 'orb2 18s ease-in-out infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.12) 35%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(35px)',
          animation: 'orb3 20s ease-in-out infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '60%',
          right: '25%',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(38px)',
          animation: 'orb4 16s ease-in-out infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '30%',
          right: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.08) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'orb5 14s ease-in-out infinite'
        }}></div>

        {/* Enhanced rotating rings */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '800px',
          height: '800px',
          transform: 'translate(-50%, -50%)',
          background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.08), transparent, rgba(139, 92, 246, 0.06), transparent, rgba(236, 72, 153, 0.04), transparent)',
          borderRadius: '50%',
          animation: 'rotate1 35s linear infinite',
          opacity: 0.4
        }}></div>

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: 'conic-gradient(from 120deg, transparent, rgba(34, 197, 94, 0.06), transparent, rgba(251, 146, 60, 0.05), transparent, rgba(147, 51, 234, 0.04), transparent)',
          borderRadius: '50%',
          animation: 'rotate2 28s linear infinite reverse',
          opacity: 0.35
        }}></div>

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400px',
          height: '400px',
          transform: 'translate(-50%, -50%)',
          background: 'conic-gradient(from 240deg, transparent, rgba(236, 72, 153, 0.05), transparent, rgba(59, 130, 246, 0.04), transparent)',
          borderRadius: '50%',
          animation: 'rotate3 22s linear infinite',
          opacity: 0.3
        }}></div>

        {/* Enhanced particle system */}
        {[...Array(25)].map((_, i) => ({
          position: 'absolute',
          width: Math.random() * 6 + 2,
          height: Math.random() * 6 + 2,
          background: `rgba(${255}, ${255}, ${255}, ${Math.random() * 0.8 + 0.2})`,
          borderRadius: '50%',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `particle ${Math.random() * 8 + 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 8}s`,
          boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(255, 255, 255, ${Math.random() * 0.5})`
        })).map((style, i) => (
          <div key={i} style={style}></div>
        ))}

        {/* Geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '100px',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          transform: 'rotate(45deg)',
          animation: 'rotate1 40s linear infinite',
          opacity: 0.3
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '8%',
          width: '80px',
          height: '80px',
          border: '2px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
          animation: 'rotate2 30s linear infinite reverse',
          opacity: 0.25
        }}></div>
      </div>

      {/* Signup/Login content: title as header (gap from top), form with gap from bottom */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '24px 0 100px 0',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: '20px'
        }}>
          {/* Main title as header: centered, with space above (not touching top) */}
          <div style={{ textAlign: 'center', marginBottom: '8px', alignSelf: 'center' }}>
            <div style={{
              display: 'inline-block',
              padding: '20px 40px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(244, 114, 182, 0.2) 50%, rgba(236, 72, 153, 0.15) 100%)',
              backdropFilter: 'blur(15px)',
              borderRadius: '20px',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 60px rgba(244, 114, 182, 0.2)',
              marginBottom: '20px'
            }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                marginTop: '12px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #3b9eff 0%, #a855f7 25%, #c084fc 50%, #f472b6 75%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(244, 114, 182, 0.4)',
                letterSpacing: '0.5px',
                filter: 'drop-shadow(0 0 25px rgba(168, 85, 247, 0.6))'
              }}>
                AI-Powered Fraud Risk Analysis
              </h1>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '15px', marginTop: '10px' }}>
              {isLogin ? 'Welcome back! Please login to your account' : 'Create your account to get started'}
            </p>
          </div>

          {/* Auth Form card */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '0',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Form Header */}
            <div style={{
              padding: '18px 32px 14px',
              borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
              background: 'rgba(15, 23, 42, 0.5)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                textAlign: 'center',
                margin: 0,
                background: 'linear-gradient(135deg, #3b9eff 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>

            {/* Form Body */}
            <div style={{ padding: '2px 32px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {!isLogin && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '2px', color: '#e5e7eb', fontSize: '14px', fontWeight: '500' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: 'white',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                        e.target.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#e5e7eb', fontSize: '12px', fontWeight: '500' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'white',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                      e.target.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Improved OR separator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '24px 0',
                  gap: '16px'
                }}>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent)'
                  }}></div>
                  <span style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>OR</span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent)'
                  }}></div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#e5e7eb', fontSize: '12px', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'white',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                      e.target.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#e5e7eb', fontSize: '12px', fontWeight: '500' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="•••••••••"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'white',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                      e.target.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#e5e7eb', fontSize: '12px', fontWeight: '500' }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="•••••••••"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                        e.target.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}

                {isLogin && (
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: loading
                      ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                      : 'linear-gradient(135deg, #3b9eff 0%, #a855f7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 15px rgba(59, 158, 255, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 20px rgba(59, 158, 255, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 15px rgba(59, 158, 255, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)';
                    }
                  }}
                >
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                </button>

                {error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}
              </form>

              {/* Switch between Login/Signup */}
              <div style={{
                marginTop: '12px',
                textAlign: 'center',
                padding: '10px 24px',
                borderTop: '1px solid rgba(59, 130, 246, 0.1)',
                background: 'rgba(15, 23, 42, 0.3)'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '11px' }}>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({
                        email: '',
                        phone: '',
                        password: '',
                        confirmPassword: '',
                        name: ''
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isLogin ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>
            </div>

          </div>
        </div>
        {/* Spacer so signup block doesn't touch footer */}
        <div style={{ minHeight: '60px', flexShrink: 0 }} />
      </div>

      {/* Features Preview - Fixed Position Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 20
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
            <span>Real-time Analysis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
            <span>ML-Powered</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
            <span>Secure</span>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes wave1 {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes wave2 {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave3 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(50%, 50%) rotate(360deg); }
        }
        @keyframes rotate1 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes rotate2 {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes rotate3 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(150px, -80px) scale(1.3) rotate(90deg); }
          50% { transform: translate(-100px, 120px) scale(0.8) rotate(180deg); }
          75% { transform: translate(80px, 60px) scale(1.1) rotate(270deg); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(-120px, 80px) scale(1.4) rotate(120deg); }
          66% { transform: translate(140px, -60px) scale(0.7) rotate(240deg); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          20% { transform: translate(80px, -100px) scale(1.25) rotate(72deg); }
          40% { transform: translate(-120px, 60px) scale(0.85) rotate(144deg); }
          60% { transform: translate(100px, 80px) scale(1.15) rotate(216deg); }
          80% { transform: translate(-60px, -80px) scale(0.9) rotate(288deg); }
        }
        @keyframes orb4 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(-150px, -40px) scale(1.35) rotate(90deg); }
          50% { transform: translate(110px, 100px) scale(0.65) rotate(180deg); }
          75% { transform: translate(-80px, -110px) scale(1.2) rotate(270deg); }
        }
        @keyframes orb5 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          30% { transform: translate(90px, 90px) scale(1.3) rotate(108deg); }
          60% { transform: translate(-110px, -60px) scale(0.7) rotate(216deg); }
        }
        @keyframes particle {
          0%, 100% { 
            opacity: 0; 
            transform: translate(0, 0) scale(0); 
          }
          10% { 
            opacity: 1; 
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1); 
          }
          90% { 
            opacity: 1; 
            transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(1.2); 
          }
        }
      `}</style>
    </div>
  );
}

export default App;
