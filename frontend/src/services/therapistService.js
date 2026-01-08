import api from './api';

const therapistService = {
    initTherapistProfile: async () => {
    const response = await api.post('/api/therapist/init-profile');
    return response;
  },
  // services/therapistService.js
removeTherapistAssignment: async (childId) => {
  try {
    return await api.delete(`api/therapist/patients/${childId}`);
  } catch (error) {
    console.error('Error in removeTherapistAssignment:', error);
    throw error;
  }
},
  // Rechercher des parents par email/nom
  searchParents: async (query) => {
    const response = await api.get('/api/therapist/search-parents', {
      params: { q: query }
    });
    return response;
  },
  assignChildToTherapist: async (childId, parentId) => {
    const response = await api.post('/api/therapist/assign-child', {
      childId,
      parentId
    });
    return response;
  },

  // Créer un enfant avec un parent (pour thérapeute)
  createChildWithParent: async (childData) => {
    const response = await api.post('/api/therapist/children', childData);
    return response;
  },

  // Obtenir tous les patients du thérapeute
  getMyPatients: async () => {
    const response = await api.get('/api/therapist/patients');
    return response;
  },

  // Obtenir les statistiques du thérapeute
  getTherapistStats: async () => {
    const response = await api.get('/api/therapist/stats');
    return response;
  },

  // Obtenir les détails d'un patient
  getPatientDetails: async (patientId) => {
    const response = await api.get(`/api/children/${patientId}`);
    return response;
  },

  // Générer un rapport pour un patient
  generateReport: async (childId) => {
    const response = await api.post(`/api/ai/report/${childId}`);
    return response;
  },
};

export default therapistService;