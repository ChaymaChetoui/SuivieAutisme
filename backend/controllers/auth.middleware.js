// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ============================================
// MIDDLEWARE : Authentification JWT
// ============================================
exports.authenticate = async (req, res, next) => {
  try {
    // 1. Récupérer le token du header Authorization
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise - Token manquant'
      });
    }

    // 3. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Récupérer l'utilisateur depuis la BDD
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // 5. Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;

    next();

  } catch (error) {
    console.error('Erreur authentification:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Authentification échouée',
      error: error.message
    });
  }
};

// ============================================
// MIDDLEWARE : Autorisation par rôle
// ============================================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier le rôle
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// ============================================
// MIDDLEWARE : Vérifier la propriété d'une ressource
// ============================================
exports.checkOwnership = (Model, paramName = 'id', ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée'
        });
      }

      // Vérifier la propriété
      const ownerId = resource[ownerField];
      
      if (ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à cette ressource'
        });
      }

      // Ajouter la ressource à la requête pour éviter une autre requête BDD
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Erreur vérification propriété:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur de vérification des permissions',
        error: error.message
      });
    }
  };
};

module.exports = exports;