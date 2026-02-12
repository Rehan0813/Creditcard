export const validateTransaction = (data) => {
    const errors = {};

    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
        errors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!data.transaction_time) {
        errors.transaction_time = 'Please select the transaction date and time';
    }

    if (!data.merchant_category) {
        errors.merchant_category = 'Please select a merchant category';
    }

    if (!data.country) {
        errors.country = 'Please select a country';
    }

    if (!data.device_type) {
        errors.device_type = 'Please select a device type';
    }

    if (!data.payment_method) {
        errors.payment_method = 'Please select a payment method';
    }

    return errors;
};
