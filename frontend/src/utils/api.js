import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Analyze a web page for dark patterns.
 * @param {Object} params
 * @param {string} [params.url] - URL to analyze
 * @param {string} [params.html] - Raw HTML to analyze
 * @param {number} [params.threshold] - Confidence threshold (0-1)
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeUrl({ url, html, threshold = 0.7 }) {
  const response = await apiClient.post('/analyze', {
    url: url || undefined,
    html: html || undefined,
    threshold,
  });
  return response.data;
}

/**
 * Check API health status.
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

export const CATEGORY_COLORS = {
  'Urgency / Scarcity': { class: 'cat-urgency', color: '#b91c1c', bg: '#b91c1c1A' },
  'Misdirection': { class: 'cat-misdirection', color: '#9b2c2c', bg: '#9b2c2c1A' },
  'Social Proof': { class: 'cat-social-proof', color: '#7f1d1d', bg: '#7f1d1d1A' },
  'Forced Continuity': { class: 'cat-forced-continuity', color: '#b45309', bg: '#b453091A' },
  'Confirm-shaming': { class: 'cat-confirm-shaming', color: '#92400e', bg: '#92400e1A' },
  'Hidden Costs': { class: 'cat-hidden-costs', color: '#9b2c2c', bg: '#9b2c2c1A' },
  'Disguised Ads': { class: 'cat-disguised-ads', color: '#b45309', bg: '#b453091A' },
};

export const SEVERITY_COLORS = {
  critical: { color: '#991b1b', bg: '#991b1b1A', label: 'Critical' },
  high: { color: '#b91c1c', bg: '#b91c1c1A', label: 'High' },
  medium: { color: '#b45309', bg: '#b453091A', label: 'Medium' },
  low: { color: '#9b2c2c', bg: '#9b2c2c1A', label: 'Low' },
};

export default apiClient;
