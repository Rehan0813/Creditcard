// In dev: if VITE_API_URL is not set, use same origin (Vite proxy).
// In prod or if VITE_API_URL is set: use that URL. Fallback to localhost if nothing else is available.
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8001');

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper - turn fetch network errors into a clear message
const handleFetchError = (err, endpoint) => {
  if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
    return new Error(
      'Cannot reach the server. Please check your internet connection or try again later.'
    );
  }
  return err;
};

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw handleFetchError(err, endpoint);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    const msg = Array.isArray(error.detail) ? error.detail.map((d) => d.msg || d).join(', ') : (error.detail || `HTTP ${response.status}`);
    throw new Error(msg);
  }

  return await response.json();
};

export const fraudApi = {
  // Authentication
  async signup(userData) {
    return await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials) {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store token
    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // File upload
  async uploadFile(file) {
    console.log(`[fraudApi] Uploading file to: ${API_BASE_URL}/api/files/upload`);
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('[fraudApi] Upload response error:', error);
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[fraudApi] Fetch catch error:', err);
      // Re-throw with more context
      if (err.message === 'Failed to fetch') {
        throw new Error(`Connection error: Cannot reach ${API_BASE_URL}. Possible CORS issue or server is down.`);
      }
      throw err;
    }
  },

  async getFiles() {
    return await apiRequest('/api/files');
  },

  // Predictions
  async predictTransaction(transactionData) {
    return await apiRequest('/api/predict', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  async predictFromFile(fileId) {
    return await apiRequest(`/api/predict/file/${fileId}`, {
      method: 'POST',
    });
  },

  async getPredictions() {
    return await apiRequest('/api/predictions');
  },

  // Feedback
  async submitFeedback(feedbackData) {
    return await apiRequest('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  async getFeedback() {
    return await apiRequest('/api/feedback');
  },

  async getFeedbackForPrediction(predictionId) {
    return await apiRequest(`/api/feedback/prediction/${predictionId}`);
  }
};