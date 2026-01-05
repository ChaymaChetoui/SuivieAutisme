// controllers/child.controller.js
const Child = require('../models/child');
const EmotionRecord = require('../models/emotionRecord');
const GameSession = require('../models/gameSessions');

// ============================================
// @desc    Créer un nouvel enfant
// @route   POST /api/children
// @access  Private
// ============================================
exports.createChild = async (req, res) => {
  try {
    // On prend TOUT le body, sans filtrer
    const childData = {
      ...req.body,
      parentId: req.user._id  // On force le parentId (sécurité)
    };

    // Optionnel : tu peux supprimer des champs sensibles si besoin
    // delete childData.someField;

    const child = await Child.create(childData);

    res.status(201).json({
      success: true,
      message: 'Enfant créé avec succès',
      data: child
    });

  } catch (error) {
    console.error('Erreur création enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'enfant',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir tous les enfants de l'utilisateur connecté
// @route   GET /api/children
// @access  Private
// ============================================
exports.getMyChildren = async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: children.length,
      data: children
    });

  } catch (error) {
    console.error('Erreur récupération enfants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des enfants',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir un enfant par son ID
// @route   GET /api/children/:id
// @access  Private
// ============================================
exports.getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le parent de cet enfant
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: child
    });

  } catch (error) {
    console.error('Erreur récupération enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'enfant',
      error: error.message
    });
  }
};

// ============================================
// @desc    Mettre à jour un enfant
// @route   PUT /api/children/:id
// @access  Private
// ============================================
exports.updateChild = async (req, res) => {
  try {
    let child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier la propriété
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Mettre à jour
    child = await Child.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Enfant mis à jour avec succès',
      data: child
    });

  } catch (error) {
    console.error('Erreur mise à jour enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'enfant',
      error: error.message
    });
  }
};

// ============================================
// @desc    Supprimer un enfant
// @route   DELETE /api/children/:id
// @access  Private
// ============================================
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier la propriété
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Supprimer toutes les données associées
    await EmotionRecord.deleteMany({ childId: child._id });
    await GameSession.deleteMany({ childId: child._id });
    await child.deleteOne();

    res.json({
      success: true,
      message: 'Enfant et données associées supprimés avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'enfant',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir le dashboard d'un enfant
// @route   GET /api/children/:id/dashboard
// @access  Private
// ============================================
exports.getChildDashboard = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier la propriété
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les statistiques des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Compter les émotions
    const emotionCount = await EmotionRecord.countDocuments({
      childId: child._id,
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Distribution des émotions
    const emotionDistribution = await EmotionRecord.aggregate([
      {
        $match: {
          childId: child._id,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Statistiques de jeu
    const gameStats = await GameSession.aggregate([
      {
        $match: {
          childId: child._id,
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // Dernières émotions
    const recentEmotions = await EmotionRecord.find({ childId: child._id })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        child,
        statistics: {
          period: '30 derniers jours',
          emotions: {
            total: emotionCount,
            distribution: emotionDistribution
          },
          games: gameStats[0] || {
            totalSessions: 0,
            avgScore: 0,
            avgAccuracy: 0,
            totalDuration: 0
          },
          recentEmotions
        }
      }
    });

  } catch (error) {
    console.error('Erreur dashboard enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir la progression d'un enfant
// @route   GET /api/children/:id/progress
// @access  Private
// ============================================
exports.getChildProgress = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier la propriété
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Progression par semaine sur les 12 dernières semaines
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const weeklyProgress = await GameSession.aggregate([
      {
        $match: {
          childId: child._id,
          startTime: { $gte: twelveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$startTime' },
            year: { $year: '$startTime' }
          },
          avgScore: { $avg: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        child,
        weeklyProgress
      }
    });

  } catch (error) {
    console.error('Erreur progression enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression',
      error: error.message
    });
  }
};

// ============================================
// @desc    Upload photo pour un enfant
// @route   POST /api/children/:id/photo
// @access  Private
// ============================================
exports.uploadChildPhoto = async (req, res) => {
  try {
    // TODO: Implémenter l'upload avec multer
    res.status(501).json({
      success: false,
      message: 'Upload de photo pas encore implémenté'
    });

  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo',
      error: error.message
    });
  }
};

module.exports = exports;