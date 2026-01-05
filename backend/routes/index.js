// routes/index.js
const express = require('express');
const router = express.Router();

// ============================================
// IMPORTER TOUTES LES ROUTES
// ============================================
const authRoutes = require('./authRoutes');
const childRoutes = require('./childRoutes');
const emotionRoutes = require('./emotionRoutes');
const aiRoutes = require('./aiRoutes');



// ============================================
// ROUTES PUBLIQUES
// ============================================

// Routes d'authentification
router.use('/api/auth', authRoutes);

// ============================================
// ROUTES PRIVÉES (nécessitent authentification)
// ============================================

// Routes des enfants
router.use('/api/children', childRoutes);

// Routes des émotions
router.use('/api/emotions', emotionRoutes);

// Routes IA
router.use('/api/ai', aiRoutes);

// ============================================
// ROUTE DE BASE
// ============================================
router.get('/', (req, res) => {
  res.json({
    message: '🎯 API Autism Tracker',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      children: '/api/children',
      emotions: '/api/emotions',
      ai: '/api/ai',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

module.exports = router;