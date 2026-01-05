// src/services/authService.js
import api from './api';

const authService = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Connexion
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Déconnexion
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Obtenir l'utilisateur connecté
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response;
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response;
  },

  // Réinitialiser le mot de passe
  resetPassword: async (token, password) => {
    const response = await api.post(`/api/auth/reset-password/${token}`, { password });
    return response;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtenir l'utilisateur depuis le localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;