import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Helper to handle errors cleanly
 */
const handleResponse = async (promise) => {
  try {
    const response = await promise;
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }
    return { success: true, data: response.data };
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      err.message ||
      'An unexpected server error occurred';
    return { success: false, error: message };
  }
};

export const checkHealth = () => handleResponse(client.get('/'));

// ANN APIs
export const trainANN = (payload) => handleResponse(client.post('/ann/train', payload));
export const predictANN = (payload) => handleResponse(client.post('/ann/predict', payload));

// CNN APIs
export const trainCNN = (payload) => handleResponse(client.post('/cnn/train', payload));
export const predictCNN = (payload) => handleResponse(client.post('/cnn/predict', payload));

// RNN APIs
export const trainRNN = (payload) => handleResponse(client.post('/rnn/train', payload));
export const predictRNN = (payload) => handleResponse(client.post('/rnn/predict', payload));

export default {
  checkHealth,
  trainANN,
  predictANN,
  trainCNN,
  predictCNN,
  trainRNN,
  predictRNN,
};
