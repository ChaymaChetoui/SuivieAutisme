// src/services/emotionService.js
import api from './api';

const emotionService = {
  // Créer une émotion
  createEmotion: async (emotionData) => {
    const response = await api.post('/api/emotions', emotionData);
    return response;
  },

  // Obtenir les émotions d'un enfant
  getEmotionsByChild: async (childId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/emotions/child/${childId}`);
    return response;
  },

  // Obtenir une émotion par ID
  getEmotionById: async (emotionId) => {
    const response = await api.get(`/api/emotions/${emotionId}`);
    return response;
  },

  // Mettre à jour une émotion
  updateEmotion: async (emotionId, emotionData) => {
    const response = await api.put(`/api/emotions/${emotionId}`, emotionData);
    return response;
  },

  // Supprimer une émotion
  deleteEmotion: async (emotionId) => {
    const response = await api.delete(`/api/emotions/${emotionId}`);
    return response;
  },

  // Obtenir les statistiques d'émotions
  getEmotionStats: async (childId, days = 30) => {
    const response = await api.get(`/api/emotions/child/${childId}/stats?days=${days}`);
    return response;
  },

  // Obtenir la timeline des émotions
  getEmotionTimeline: async (childId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/emotions/child/${childId}/timeline?${queryString}`);
    return response;
  },

  // Obtenir la heatmap des émotions
  getEmotionHeatmap: async (childId) => {
    const response = await api.get(`/api/emotions/child/${childId}/heatmap`);
    return response;
  },
};

export default emotionService;