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
  'Urgency / Scarcity': { class: 'cat-urgency', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  'Misdirection': { class: 'cat-misdirection', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  'Social Proof': { class: 'cat-social-proof', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  'Forced Continuity': { class: 'cat-forced-continuity', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  'Confirm-shaming': { class: 'cat-confirm-shaming', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  'Hidden Costs': { class: 'cat-hidden-costs', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)' },
  'Disguised Ads': { class: 'cat-disguised-ads', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
};

export const SEVERITY_COLORS = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Medium' },
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Low' },
};

export default apiClient;
