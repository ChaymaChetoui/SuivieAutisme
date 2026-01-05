// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const Child = require('../models/child');
const jwt = require('jsonwebtoken');
// ============================================
// VALIDATEURS
// ============================================

const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir une majuscule, une minuscule et un chiffre'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('role')
    .optional()
    .isIn(['parent', 'therapist'])
    .withMessage('Rôle invalide')
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

// @route   POST /api/auth/register
// @desc    Inscription
// @access  Public
router.post('/register', registerValidator, validate, authController.register);

// @route   POST /api/auth/login
// @desc    Connexion
// @access  Public
router.post('/login', loginValidator, validate, authController.login);

// @route   POST /api/auth/refresh-token
// @desc    Rafraîchir le token
// @access  Public
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Mot de passe oublié
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email invalide')
], validate, authController.forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Réinitialiser le mot de passe
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
], validate, authController.resetPassword);

router.post('/child-login', async (req, res) => {
  try {
    const { code } = req.body;

    // Validation basique
    if (!code || typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Le code doit contenir exactement 6 chiffres' });
    }

    // Recherche de l'enfant
    const child = await Child.findOne({
      loginCode: code.trim(),
      loginCodeActive: { $ne: false } // Au cas où tu veuilles désactiver un code
    });

    if (!child) {
      return res.status(400).json({ message: 'Code incorrect ou inactif' });
    }

    // Important : on récupère le parent pour que le middleware authenticate fonctionne ensuite
    const populatedChild = await Child.findById(child._id).populate('parentId');

    if (!populatedChild.parentId) {
      return res.status(500).json({ message: 'Erreur : parent non trouvé' });
    }

    // Génération du token JWT (identique à celui des parents)
    const token = jwt.sign(
      {
        userId: populatedChild.parentId._id,   // Nécessaire pour authenticate middleware
        childId: populatedChild._id,
        role: 'child'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Longue durée pour l'app enfant
    );

    // Réponse attendue par l'app Flutter
    res.json({
      token,
      childId: populatedChild._id.toString(),
      childName: populatedChild.name || 'Petit Champion'
    });

  } catch (error) {
    console.error('Erreur child-login:', error);
    res.status(500).json({ message: 'Erreur serveur, réessaie plus tard' });
  }
});
// ============================================
// ROUTES PRIVÉES (Authentication requise)
// ============================================

// @route   GET /api/auth/me
// @desc    Obtenir l'utilisateur connecté
// @access  Private
router.get('/me', authenticate, authController.getMe);

// @route   POST /api/auth/logout
// @desc    Déconnexion
// @access  Private
router.post('/logout', authenticate, authController.logout);

module.exports = router;