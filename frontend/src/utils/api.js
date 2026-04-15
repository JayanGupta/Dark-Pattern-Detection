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

/**
 * Map category names to CSS class names.
 */
export const CATEGORY_COLORS = {
  'Urgency / Scarcity': { class: 'cat-urgency', color: '#ff4444', bg: 'rgba(255, 68, 68, 0.12)' },
  'Misdirection': { class: 'cat-misdirection', color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.12)' },
  'Social Proof': { class: 'cat-social-proof', color: '#ff2d7c', bg: 'rgba(255, 45, 124, 0.12)' },
  'Forced Continuity': { class: 'cat-forced-continuity', color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.12)' },
  'Confirm-shaming': { class: 'cat-confirm-shaming', color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.12)' },
  'Hidden Costs': { class: 'cat-hidden-costs', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.12)' },
  'Disguised Ads': { class: 'cat-disguised-ads', color: '#00aaff', bg: 'rgba(0, 170, 255, 0.12)' },
};

export const SEVERITY_COLORS = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Medium' },
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Low' },
};

export default apiClient;
