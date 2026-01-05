// controllers/auth.controller.js
const User = require('../models/user');
const Profile = require('../models/profile');
const jwt = require('jsonwebtoken');

// ============================================
// UTILITAIRE : Générer un JWT
// ============================================
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// ============================================
// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
// ============================================
exports.register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      role: role || 'parent'
    });

    // Créer le profil associé (relation 1-to-1)
    await Profile.create({
      userId: user._id,
      firstName,
      lastName,
      phone
    });

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// ============================================
// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si tous les champs sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Récupérer l'utilisateur avec le password (select: false par défaut)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Récupérer le profil
    const profile = await Profile.findOne({ userId: user._id });

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: profile ? {
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: profile.avatar
          } : null
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// ============================================
// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh-token
// @access  Public
// ============================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer un nouveau token
    const newToken = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('Erreur refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
// ============================================
exports.getMe = async (req, res) => {
  try {
    // req.user est défini par le middleware authenticate
    const user = await User.findById(req.user._id);
    const profile = await Profile.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        profile
      }
    });

  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// ============================================
// @desc    Déconnexion
// @route   POST /api/auth/logout
// @access  Private
// ============================================
exports.logout = async (req, res) => {
  try {
    // Dans une vraie application, vous pourriez blacklister le token
    // Pour l'instant, on laisse le client supprimer le token
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};

// ============================================
// @desc    Mot de passe oublié
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte avec cet email'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Sauvegarder le token dans la BDD
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 heure
    await user.save();

    // TODO: Envoyer un email avec le lien de réinitialisation
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé',
      // En développement seulement:
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
};

// ============================================
// @desc    Réinitialiser le mot de passe
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ============================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
      error: error.message
    });
  }
};

module.exports = exports;