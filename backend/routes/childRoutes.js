// routes/child.routes.js
const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// ============================================
// VALIDATEURS
// ============================================

const childValidator = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date de naissance invalide')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 18) {
        throw new Error('L\'enfant doit avoir entre 0 et 18 ans');
      }
      return true;
    }),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Genre invalide'),
  
  body('autismLevel')
    .isIn(['léger', 'modéré', 'sévère'])
    .withMessage('Niveau d\'autisme invalide')
];

// ============================================
// Toutes les routes nécessitent une authentification
// ============================================
router.use(authenticate);

// ============================================
// ROUTES CRUD
// ============================================

// @route   POST /api/children
// @desc    Créer un nouvel enfant
// @access  Private (parent, therapist)
router.post('/', 
  authorize('parent', 'therapist'),
  childValidator, 
  validate, 
  childController.createChild
);

// @route   GET /api/children
// @desc    Obtenir tous les enfants de l'utilisateur connecté
// @access  Private
router.get('/', childController.getMyChildren);

// @route   GET /api/children/:id
// @desc    Obtenir les détails d'un enfant
// @access  Private
router.get('/:id', childController.getChildById);

// @route   PUT /api/children/:id
// @desc    Mettre à jour un enfant
// @access  Private
router.put('/:id', 
  childValidator, 
  validate, 
  childController.updateChild
);

// @route   DELETE /api/children/:id
// @desc    Supprimer un enfant
// @access  Private
router.delete('/:id', childController.deleteChild);

// ============================================
// ROUTES SPÉCIFIQUES
// ============================================

// @route   GET /api/children/:id/dashboard
// @desc    Obtenir le dashboard d'un enfant (stats complètes)
// @access  Private
router.get('/:id/dashboard', childController.getChildDashboard);

// @route   GET /api/children/:id/progress
// @desc    Obtenir la progression d'un enfant
// @access  Private
router.get('/:id/progress', childController.getChildProgress);

// @route   POST /api/children/:id/photo
// @desc    Upload une photo pour un enfant
// @access  Private
router.post('/:id/photo', childController.uploadChildPhoto);

module.exports = router;