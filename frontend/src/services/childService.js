// src/services/childService.js
import api from './api';

const childService = {
  // Créer un enfant
  createChild: async (childData) => {
    const response = await api.post('/api/children', childData);
    return response;
  },

  // Obtenir tous les enfants
  getAllChildren: async () => {
    const response = await api.get('/api/children');
    return response;
  },

  // Obtenir un enfant par ID
  getChildById: async (childId) => {
    const response = await api.get(`/api/children/${childId}`);
    return response;
  },

  // Mettre à jour un enfant
  updateChild: async (childId, childData) => {
    const response = await api.put(`/api/children/${childId}`, childData);
    return response;
  },

  // Supprimer un enfant
  deleteChild: async (childId) => {
    const response = await api.delete(`/api/children/${childId}`);
    return response;
  },

  // Obtenir le dashboard d'un enfant
  getChildDashboard: async (childId) => {
    const response = await api.get(`/api/children/${childId}/dashboard`);
    return response;
  },

  // Obtenir la progression d'un enfant
  getChildProgress: async (childId) => {
    const response = await api.get(`/api/children/${childId}/progress`);
    return response;
  },
};

export default childService;