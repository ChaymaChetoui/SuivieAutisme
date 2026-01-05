// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Configuration de base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || 'Une erreur est survenue';
    
    // Gérer les erreurs spécifiques
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expirée. Veuillez vous reconnecter.');
    } else if (error.response?.status === 403) {
      toast.error('Accès non autorisé');
    } else if (error.response?.status === 404) {
      toast.error('Ressource non trouvée');
    } else if (error.response?.status === 429) {
      toast.error('Trop de requêtes. Veuillez patienter.');
    } else if (error.response?.status >= 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;