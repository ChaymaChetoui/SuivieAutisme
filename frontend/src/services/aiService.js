// src/services/aiService.js
import api from './api';

const aiService = {
  // Générer des insights IA
  generateInsights: async (childId, period = 30) => {
    const response = await api.post(`/api/ai/insights/${childId}?period=${period}`);
    return response;
  },

  // Obtenir des recommandations
  getRecommendations: async (childId) => {
    const response = await api.post(`/api/ai/recommendations/${childId}`);
    return response;
  },

  // Analyser les tendances
  analyzeTrends: async (childId) => {
    const response = await api.get(`/api/ai/trends/${childId}`);
    return response;
  },

  // Générer un rapport de progression
  generateProgressReport: async (childId) => {
    const response = await api.post(`/api/ai/report/${childId}`);
    return response;
  },
};

export default aiService;