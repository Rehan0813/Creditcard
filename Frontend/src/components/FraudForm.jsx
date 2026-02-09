import React, { useState } from 'react';
import Input from './common/Input';
import Button from './common/Button';
import { validateTransaction } from '../utils/validators';

const FraudForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    amount: '',
    transaction_time: '',
    merchant_category: '',
    country: '',
    device_type: '',
    payment_method: '',
    channel: '',
    merchant_country: '',
    transaction_count_24h: '',
    avg_amount_24h: ''
  });

  const [errors, setErrors] = useState({});

  const merchantCategories = [
    { value: 'retail', label: 'Retail' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'gas_station', label: 'Gas Station' },
    { value: 'grocery', label: 'Grocery' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'travel', label: 'Travel' },
    { value: 'online_services', label: 'Online Services' },
    { value: 'other', label: 'Other' }
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'CN', label: 'China' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' },
    { value: 'OTHER', label: 'Other' }
  ];

  const deviceTypes = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'pos', label: 'Point of Sale' },
    { value: 'atm', label: 'ATM' }
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cryptocurrency', label: 'Cryptocurrency' }
  ];

  const channels = [
    { value: 'online', label: 'Online' },
    { value: 'in_store', label: 'In-Store' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'phone', label: 'Phone' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateTransaction(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const submissionData = Object.keys(formData).reduce((acc, key) => {
      if (formData[key] !== '') {
        acc[key] = formData[key];
      }
      return acc;
    }, {});

    onSubmit(submissionData);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 20, // Explicitly higher than Vanta
      paddingTop: '40px',
      paddingBottom: '80px'
    }}>
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)', // Dark translucent background
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Header Section */}
        <div style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444' }}></span>
              Transaction Analysis
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '16px', margin: 0 }}>
              Enter transaction details for AI-powered fraud detection
            </p>
          </div>

          <div style={{
            padding: '8px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '999px',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
            Secure Analysis
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* CSS to hide number spinners */}
          <style>
            {`
              input[type=number]::-webkit-inner-spin-button, 
              input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
              }
              input[type=number] {
                -moz-appearance: textfield;
              }
            `}
          </style>

          {/* Section 1: Payment Information */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.4)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ height: '20px', width: '4px', background: 'linear-gradient(to bottom, #ef4444, #3b82f6)', borderRadius: '2px' }}></span>
              Payment Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <Input
                label="Transaction Amount *"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="e.g. 150.00"
                error={errors.amount}
                required
              />
              <Input
                label="Transaction Date & Time *"
                type="datetime-local"
                value={formData.transaction_time}
                onChange={(e) => handleInputChange('transaction_time', e.target.value)}
                error={errors.transaction_time}
                required
              />
              <Input
                label="Payment Method *"
                type="select"
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                options={paymentMethods}
                error={errors.payment_method}
                required
              />
              <Input
                label="Transaction Country *"
                type="select"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                options={countries}
                error={errors.country}
                required
              />
            </div>
          </div>

          {/* Section 2: Merchant & Context */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.4)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ height: '20px', width: '4px', background: 'linear-gradient(to bottom, #a855f7, #ec4899)', borderRadius: '2px' }}></span>
              Merchant & Context
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <Input
                label="Merchant Category *"
                type="select"
                value={formData.merchant_category}
                onChange={(e) => handleInputChange('merchant_category', e.target.value)}
                options={merchantCategories}
                error={errors.merchant_category}
                required
              />
              <Input
                label="Device Type *"
                type="select"
                value={formData.device_type}
                onChange={(e) => handleInputChange('device_type', e.target.value)}
                options={deviceTypes}
                error={errors.device_type}
                required
              />

            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            marginTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '32px'
          }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormData({
                amount: '',
                transaction_time: '',
                merchant_category: '',
                country: '',
                device_type: '',
                payment_method: ''
              })}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e5e7eb',
                padding: '12px 24px'
              }}
            >
              🔄 Clear Form
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="" // removing classname to rely on internal styles
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                padding: '12px 36px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
              }}
            >
              {loading ? 'Analyzing...' : '🔍 Analyze Transaction'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FraudForm;