// controllers/emotion.controller.js
const EmotionRecord = require('../models/emotionRecord');
const Child = require('../models/child');
const mongoose = require('mongoose');
const Therapist = require('../models/Therapist'); // AJOUTER CETTE LIGNE
const ChildTherapist = require('../models/childTherapist');
// ============================================
// @desc    Créer un nouvel enregistrement d'émotion
// @route   POST /api/emotions
// @access  Private
// ============================================
exports.createEmotion = async (req, res) => {
  try {
    const { childId,  confidence, ...emotionData } = req.body;

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérification d'accès selon le rôle
    let hasAccess = false;

    if (req.user.role === 'parent') {
      if (child.parentId.toString() === req.user._id.toString()) {
        hasAccess = true;
      }
    } else if (req.user.role === 'therapist') {
      const therapist = await Therapist.findOne({ userId: req.user._id });
      if (therapist) {
        const assignment = await ChildTherapist.findOne({
          childId,
          therapistId: therapist._id,
          status: 'active'
        });
        if (assignment) hasAccess = true;
      }
    } else if (req.user.role === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cet enfant'
      });
    }

    const emotionRecord = await EmotionRecord.create({
      childId,confidence: confidence || null, 
      ...emotionData
    });

    res.status(201).json({
      success: true,
      message: 'Émotion enregistrée avec succès',
      data: emotionRecord
    });

  } catch (error) {
    console.error('Erreur création émotion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

  

// ============================================
// @desc    Obtenir toutes les émotions d'un enfant
// @route   GET /api/emotions/child/:childId
// @access  Private
// ============================================
// Dans la méthode getEmotionsByChild
exports.getEmotionsByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 50, page = 1, emotion, source, startDate, endDate } = req.query;

    // Vérifier que l'enfant existe
    const child = await Child.findById(childId);
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier l'accès selon le rôle
    let hasAccess = false;

    if (req.user.role === 'parent') {
      // Parent : vérifier que c'est son enfant
      if (child.parentId.toString() === req.user._id.toString()) {
        hasAccess = true;
      }
    } else if (req.user.role === 'therapist') {
      // Thérapeute : vérifier qu'il est assigné à cet enfant
      const therapist = await Therapist.findOne({ userId: req.user._id });
      if (therapist) {
        const assignment = await ChildTherapist.findOne({
          childId: child._id,
          therapistId: therapist._id,
          status: 'active'
        });
        if (assignment) hasAccess = true;
      }
    } else if (req.user.role === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cet enfant'
      });
    }

    // Construire la requête
    const query = { childId };

    if (emotion) {
      query.emotion = emotion;
    }

    if (source) {
      query.source = source;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await EmotionRecord.countDocuments(query);

    const emotions = await EmotionRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: emotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur récupération émotions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des émotions',
      error: error.message
    });
  }
};
// ============================================
// @desc    Obtenir une émotion par ID
// @route   GET /api/emotions/:id
// @access  Private
// ============================================
exports.getEmotionById = async (req, res) => {
  try {
    const emotion = await EmotionRecord.findById(req.params.id).populate('childId');

    if (!emotion) {
      return res.status(404).json({
        success: false,
        message: 'Émotion non trouvée'
      });
    }

    // Vérifier la propriété
    if (emotion.childId.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: emotion
    });

  } catch (error) {
    console.error('Erreur récupération émotion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'émotion',
      error: error.message
    });
  }
};

// ============================================
// @desc    Mettre à jour une émotion
// @route   PUT /api/emotions/:id
// @access  Private
// ============================================
exports.updateEmotion = async (req, res) => {
  try {
    let emotion = await EmotionRecord.findById(req.params.id).populate('childId');

    if (!emotion) {
      return res.status(404).json({
        success: false,
        message: 'Émotion non trouvée'
      });
    }

    // Vérifier la propriété
    if (emotion.childId.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    emotion = await EmotionRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Émotion mise à jour avec succès',
      data: emotion
    });

  } catch (error) {
    console.error('Erreur mise à jour émotion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'émotion',
      error: error.message
    });
  }
};

// ============================================
// @desc    Supprimer une émotion
// @route   DELETE /api/emotions/:id
// @access  Private
// ============================================
exports.deleteEmotion = async (req, res) => {
  try {
    const emotion = await EmotionRecord.findById(req.params.id).populate('childId');

    if (!emotion) {
      return res.status(404).json({
        success: false,
        message: 'Émotion non trouvée'
      });
    }

    // Vérifier la propriété
    if (emotion.childId.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await emotion.deleteOne();

    res.json({
      success: true,
      message: 'Émotion supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression émotion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'émotion',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir les statistiques d'émotions
// @route   GET /api/emotions/child/:childId/stats
// @access  Private
// ============================================
exports.getEmotionStats = async (req, res) => {
  try {
    const { childId } = req.params;
    const { days = 30 } = req.query;

    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // FIX: Utiliser new mongoose.Types.ObjectId()
    const stats = await EmotionRecord.aggregate([
      {
        $match: {
          childId: new mongoose.Types.ObjectId(childId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $facet: {
          byEmotion: [
            {
              $group: {
                _id: '$emotion',
                count: { $sum: 1 },
                avgIntensity: { $avg: '$intensity' },
                avgConfidence: { $avg: '$confidence' }
              }
            },
            { $sort: { count: -1 } }
          ],
          bySource: [
            {
              $group: {
                _id: '$source',
                count: { $sum: 1 }
              }
            }
          ],
          byLocation: [
            {
              $group: {
                _id: '$location',
                count: { $sum: 1 }
              }
            }
          ],
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgIntensity: { $avg: '$intensity' },
                avgDuration: { $avg: '$duration' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} derniers jours`,
        statistics: stats[0]
      }
    });

  } catch (error) {
    console.error('Erreur stats émotions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir la timeline des émotions
// @route   GET /api/emotions/child/:childId/timeline
// @access  Private
// ============================================
exports.getEmotionTimeline = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // FIX: Utiliser new mongoose.Types.ObjectId()
    const query = { childId: new mongoose.Types.ObjectId(childId) };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Grouper par jour
    const timeline = await EmotionRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            emotion: '$emotion'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: timeline
    });

  } catch (error) {
    console.error('Erreur timeline émotions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la timeline',
      error: error.message
    });
  }
};

// ============================================
// @desc    Obtenir une heatmap des émotions
// @route   GET /api/emotions/child/:childId/heatmap
// @access  Private
// ============================================
exports.getEmotionHeatmap = async (req, res) => {
  try {
    const { childId } = req.params;

    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // FIX: Utiliser new mongoose.Types.ObjectId()
    const heatmap = await EmotionRecord.aggregate([
      {
        $match: {
          childId: new mongoose.Types.ObjectId(childId),
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$timestamp' },
            hour: { $hour: '$timestamp' },
            emotion: '$emotion'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]);

    res.json({
      success: true,
      data: heatmap
    });

  } catch (error) {
    console.error('Erreur heatmap émotions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la heatmap',
      error: error.message
    });
  }
};

module.exports = exports;