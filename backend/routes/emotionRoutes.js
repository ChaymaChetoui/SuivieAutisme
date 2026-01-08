// routes/emotion.routes.js
const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const { authenticate } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// ============================================
// VALIDATEURS
// ============================================

const emotionValidator = [
  body('childId')
    .isMongoId()
    .withMessage('ID enfant invalide'),
  
  body('emotion')
    .isIn(['joie', 'tristesse', 'colère', 'peur', 'surprise', 'neutre', 'dégoût'])
    .withMessage('Émotion invalide'),
  
  body('source')
    .isIn(['camera_nlp', 'game', 'manual', 'parent_observation', 'chat'])
    .withMessage('Source invalide'),
  
  body('confidence')
  .optional()
  .custom((value) => {
    // Accepte null ou un nombre entre 0 et 100
    if (value === null || value === undefined) return true;
    if (typeof value !== 'number') return false;
    return value >= 0 && value <= 100;
  })
  .withMessage('La confiance doit être entre 0 et 100 ou null'),
  
  body('context')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le contexte ne doit pas dépasser 500 caractères'),
  
  body('intensity')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('L\'intensité doit être entre 1 et 5')
];

// ============================================
// Toutes les routes nécessitent une authentification
// ============================================
router.use(authenticate);

// ============================================
// ROUTES CRUD
// ============================================

// @route   POST /api/emotions
// @desc    Enregistrer une nouvelle émotion
// @access  Private
router.post('/', 
  emotionValidator, 
  validate, 
  emotionController.createEmotion
);

// @route   GET /api/emotions/child/:childId
// @desc    Obtenir toutes les émotions d'un enfant
// @access  Private
router.get('/child/:childId', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('emotion').optional().isIn(['joie', 'tristesse', 'colère', 'peur', 'surprise', 'neutre', 'dégoût']),
  query('source').optional().isIn(['camera_nlp', 'game', 'manual', 'parent_observation', 'chat'])
], validate, emotionController.getEmotionsByChild);

// @route   GET /api/emotions/:id
// @desc    Obtenir les détails d'une émotion
// @access  Private
router.get('/:id', emotionController.getEmotionById);

// @route   PUT /api/emotions/:id
// @desc    Mettre à jour une émotion
// @access  Private
router.put('/:id', 
  [
    body('emotion').optional().isIn(['joie', 'tristesse', 'colère', 'peur', 'surprise', 'neutre', 'dégoût']),
    body('context').optional().trim().isLength({ max: 500 }),
    body('notes').optional().trim().isLength({ max: 1000 })
  ], 
  validate, 
  emotionController.updateEmotion
);

// @route   DELETE /api/emotions/:id
// @desc    Supprimer une émotion
// @access  Private
router.delete('/:id', emotionController.deleteEmotion);

// ============================================
// ROUTES STATISTIQUES
// ============================================

// @route   GET /api/emotions/child/:childId/stats
// @desc    Obtenir les statistiques d'émotions d'un enfant
// @access  Private
router.get('/child/:childId/stats', [
  query('days').optional().isInt({ min: 1, max: 365 })
], validate, emotionController.getEmotionStats);

// @route   GET /api/emotions/child/:childId/timeline
// @desc    Obtenir la timeline des émotions
// @access  Private
router.get('/child/:childId/timeline', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], validate, emotionController.getEmotionTimeline);

// @route   GET /api/emotions/child/:childId/heatmap
// @desc    Obtenir une heatmap des émotions par jour/heure
// @access  Private
router.get('/child/:childId/heatmap', emotionController.getEmotionHeatmap);

module.exports = router;