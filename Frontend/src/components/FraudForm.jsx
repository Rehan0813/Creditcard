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
    <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Analyze Transaction</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Transaction Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="100.00"
            error={errors.amount}
            required
          />

          <Input
            label="Transaction Time"
            type="datetime-local"
            value={formData.transaction_time}
            onChange={(e) => handleInputChange('transaction_time', e.target.value)}
            error={errors.transaction_time}
            required
          />

          <Input
            label="Merchant Category"
            type="select"
            value={formData.merchant_category}
            onChange={(e) => handleInputChange('merchant_category', e.target.value)}
            options={merchantCategories}
            error={errors.merchant_category}
            required
          />

          <Input
            label="Country"
            type="select"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            options={countries}
            error={errors.country}
            required
          />

          <Input
            label="Device Type"
            type="select"
            value={formData.device_type}
            onChange={(e) => handleInputChange('device_type', e.target.value)}
            options={deviceTypes}
            error={errors.device_type}
            required
          />

          <Input
            label="Payment Method"
            type="select"
            value={formData.payment_method}
            onChange={(e) => handleInputChange('payment_method', e.target.value)}
            options={paymentMethods}
            error={errors.payment_method}
            required
          />

          <Input
            label="Channel"
            type="select"
            value={formData.channel}
            onChange={(e) => handleInputChange('channel', e.target.value)}
            options={channels}
            placeholder="Select channel (optional)"
            error={errors.channel}
          />

          <Input
            label="Merchant Country"
            type="select"
            value={formData.merchant_country}
            onChange={(e) => handleInputChange('merchant_country', e.target.value)}
            options={countries}
            placeholder="Select merchant country (optional)"
            error={errors.merchant_country}
          />

          <Input
            label="Transaction Count (24h)"
            type="number"
            value={formData.transaction_count_24h}
            onChange={(e) => handleInputChange('transaction_count_24h', e.target.value)}
            placeholder="Number of transactions in last 24 hours"
            error={errors.transaction_count_24h}
          />

          <Input
            label="Average Amount (24h)"
            type="number"
            step="0.01"
            value={formData.avg_amount_24h}
            onChange={(e) => handleInputChange('avg_amount_24h', e.target.value)}
            placeholder="Average transaction amount in last 24 hours"
            error={errors.avg_amount_24h}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFormData({
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
            })}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Analyzing...' : 'Analyze Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FraudForm;