// routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// ============================================
// RATE LIMITER pour les requêtes IA (coûteuses)
// ============================================
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 requêtes max par heure
  message: {
    success: false,
    message: 'Trop de requêtes IA, réessayez dans 1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Toutes les routes nécessitent une authentification
// ============================================
router.use(authenticate);

// ============================================
// ROUTES IA
// ============================================

// @route   POST /api/ai/insights/:childId
// @desc    Générer des insights IA pour un enfant
// @access  Private
// @rate    20 req/heure
router.post('/insights/:childId', aiLimiter, aiController.generateInsights);

// @route   POST /api/ai/recommendations/:childId
// @desc    Générer des recommandations personnalisées
// @access  Private
// @rate    20 req/heure
router.post('/recommendations/:childId', aiLimiter, aiController.getRecommendations);

// @route   GET /api/ai/trends/:childId
// @desc    Analyser les tendances émotionnelles
// @access  Private
// @rate    20 req/heure
router.get('/trends/:childId', aiLimiter, aiController.analyzeTrends);

// @route   POST /api/ai/report/:childId
// @desc    Générer un rapport de progression complet
// @access  Private
// @rate    20 req/heure
router.post('/report/:childId', aiLimiter, aiController.generateProgressReport);

module.exports = router;