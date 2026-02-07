export const validateTransaction = (data) => {

  const errors = {};



  if (!data.amount || data.amount === '') {

    errors.amount = 'Transaction amount is required';

  } else if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {

    errors.amount = 'Amount must be a positive number';

  } else if (parseFloat(data.amount) > 1000000) {

    errors.amount = 'Amount seems unusually high (max: $1,000,000)';

  }



  if (!data.transaction_time || data.transaction_time === '') {

    errors.transaction_time = 'Transaction time is required';

  } else {

    const transactionDate = new Date(data.transaction_time);

    const now = new Date();

    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    

    if (isNaN(transactionDate.getTime())) {

      errors.transaction_time = 'Invalid date format';

    } else if (transactionDate > now) {

      errors.transaction_time = 'Transaction time cannot be in the future';

    } else if (transactionDate < oneYearAgo) {

      errors.transaction_time = 'Transaction time cannot be more than 1 year old';

    }

  }



  if (!data.merchant_category || data.merchant_category === '') {

    errors.merchant_category = 'Merchant category is required';

  }



  if (!data.country || data.country === '') {

    errors.country = 'Country is required';

  }



  if (!data.device_type || data.device_type === '') {

    errors.device_type = 'Device type is required';

  }



  if (!data.payment_method || data.payment_method === '') {

    errors.payment_method = 'Payment method is required';

  }



  if (data.transaction_count_24h && data.transaction_count_24h !== '') {

    const count = parseInt(data.transaction_count_24h);

    if (isNaN(count) || count < 0) {

      errors.transaction_count_24h = 'Transaction count must be a non-negative integer';

    } else if (count > 1000) {

      errors.transaction_count_24h = 'Transaction count seems unusually high (max: 1000)';

    }

  }



  if (data.avg_amount_24h && data.avg_amount_24h !== '') {

    const avgAmount = parseFloat(data.avg_amount_24h);

    if (isNaN(avgAmount) || avgAmount < 0) {

      errors.avg_amount_24h = 'Average amount must be a non-negative number';

    } else if (avgAmount > 1000000) {

      errors.avg_amount_24h = 'Average amount seems unusually high (max: $1,000,000)';

    }

  }



  return errors;

};



export const validateCSVFile = (file) => {

  const errors = [];



  if (!file) {

    errors.push('Please select a CSV file');

    return errors;

  }



  if (!file.name.toLowerCase().endsWith('.csv')) {

    errors.push('File must be a CSV file (.csv extension)');

  }



  const maxSize = 50 * 1024 * 1024; // 50MB

  if (file.size > maxSize) {

    errors.push('File size must be less than 50MB');

  }



  if (file.size === 0) {

    errors.push('File cannot be empty');

  }



  return errors;

};



export const sanitizeInput = (input) => {

  if (typeof input !== 'string') return input;

  

  return input

    .trim()

    .replace(/[<>]/g, '')

    .replace(/javascript:/gi, '')

    .replace(/on\w+=/gi, '');

};