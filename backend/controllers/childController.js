// controllers/childController.js
const Child = require('../models/child');
const EmotionRecord = require('../models/emotionRecord');
const GameSession = require('../models/gameSessions');
const Therapist = require('../models/Therapist');
const ChildTherapist = require('../models/childTherapist');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Fonction pour vérifier l'accès thérapeute
const checkTherapistAccess = async (userId, childId) => {
  try {
    const therapist = await Therapist.findOne({ userId });
    if (!therapist) return false;

    const assignment = await ChildTherapist.findOne({
      childId,
      therapistId: therapist._id,
      status: 'active'
    });

    return !!assignment;
  } catch (error) {
    console.error('Error checking therapist access:', error);
    return false;
  }
};

// Fonction helper pour calculer l'âge
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Fonction pour obtenir les statistiques d'un enfant
const getChildWithStats = async (child) => {
  try {
    // Calculer l'âge
    const age = calculateAge(child.dateOfBirth);

    // Compter les émotions des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const emotionCount = await EmotionRecord.countDocuments({
      childId: child._id,
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Compter les sessions de jeu
    const gameSessionCount = await GameSession.countDocuments({
      childId: child._id,
      startTime: { $gte: thirtyDaysAgo }
    });

    // Dernière activité
    const lastEmotion = await EmotionRecord.findOne({ childId: child._id })
      .sort({ timestamp: -1 })
      .select('timestamp emotion')
      .lean();

    const lastGame = await GameSession.findOne({ childId: child._id })
      .sort({ startTime: -1 })
      .select('startTime gameType')
      .lean();

    return {
      ...child.toObject(),
      age: age,
      stats: {
        emotionCountLast30Days: emotionCount,
        gameSessionCountLast30Days: gameSessionCount,
        lastActivity: lastEmotion?.timestamp || lastGame?.startTime || null,
        lastEmotion: lastEmotion?.emotion || null
      }
    };
    
  } catch (error) {
    console.error('Error getting child stats:', error);
    // En cas d'erreur, retourner juste les données de base
    const age = calculateAge(child.dateOfBirth);
    return {
      ...child.toObject(),
      age: age,
      stats: {
        emotionCountLast30Days: 0,
        gameSessionCountLast30Days: 0,
        lastActivity: null,
        lastEmotion: null
      }
    };
  }
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// @desc    Créer un nouvel enfant
// @route   POST /api/children
// @access  Private
exports.createChild = async (req, res) => {
  try {
    // On prend TOUT le body, sans filtrer
    const childData = {
      ...req.body,
      parentId: req.user._id  // On force le parentId (sécurité)
    };

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

// @desc    Obtenir tous les enfants de l'utilisateur connecté
// @route   GET /api/children
// @access  Private
exports.getMyChildren = async (req, res) => {
  try {
    let children = [];

    if (req.user.role === 'parent') {
      // Pour les parents : leurs propres enfants
      children = await Child.find({ parentId: req.user._id })
        .sort({ createdAt: -1 });
    } 
    else if (req.user.role === 'therapist') {
      // Pour les thérapeutes : les enfants qui leur sont assignés
      const therapist = await Therapist.findOne({ userId: req.user._id });
      
      if (therapist) {
        const assignments = await ChildTherapist.find({
          therapistId: therapist._id,
          status: 'active'
        }).populate('childId');

        children = assignments
          .map(a => a.childId)
          .filter(child => child !== null);
      }
    } 
    else if (req.user.role === 'admin') {
      // Pour les admins : tous les enfants
      children = await Child.find().sort({ createdAt: -1 });
    }

    // Ajouter l'âge à chaque enfant
    const childrenWithAge = children.map(child => {
      const age = calculateAge(child.dateOfBirth);
      return {
        ...child.toObject(),
        age
      };
    });

    res.json({
      success: true,
      count: children.length,
      data: childrenWithAge
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

// @desc    Obtenir un enfant par son ID
// @route   GET /api/children/:id
// @access  Private
exports.getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    console.log('Access check - isParent:', isParent, 'isTherapist:', isTherapist, 'User role:', req.user.role);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les données additionnelles
    const childWithStats = await getChildWithStats(child);

    res.json({
      success: true,
      data: childWithStats
    });

  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un enfant
// @route   PUT /api/children/:id
// @access  Private
exports.updateChild = async (req, res) => {
  try {
    let child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // NOTE: Les thérapeutes ne peuvent peut-être pas modifier l'enfant
    // Seul le parent peut modifier (ou admin)
    if (!isParent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le parent peut modifier les informations de l\'enfant'
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

// @desc    Supprimer un enfant
// @route   DELETE /api/children/:id
// @access  Private
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier la propriété - SEUL LE PARENT PEUT SUPPRIMER
    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seul le parent peut supprimer un enfant.'
      });
    }

    // Supprimer toutes les données associées
    await EmotionRecord.deleteMany({ childId: child._id });
    await GameSession.deleteMany({ childId: child._id });
    
    // Supprimer les assignations ChildTherapist
    await ChildTherapist.deleteMany({ childId: child._id });
    
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

// @desc    Obtenir le dashboard d'un enfant
// @route   GET /api/children/:id/dashboard
// @access  Private
exports.getChildDashboard = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    console.log('Dashboard access check - isParent:', isParent, 'isTherapist:', isTherapist, 'User role:', req.user.role);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
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

// @desc    Obtenir la progression d'un enfant
// @route   GET /api/children/:id/progress
// @access  Private
exports.getChildProgress = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
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

// @desc    Upload photo pour un enfant
// @route   POST /api/children/:id/photo
// @access  Private
exports.uploadChildPhoto = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // TODO: Implémenter l'upload avec multer
    // Pour l'instant, accepter juste une URL
    if (req.body.photoUrl) {
      child.photoUrl = req.body.photoUrl;
      await child.save();
      
      return res.json({
        success: true,
        message: 'Photo mise à jour avec succès',
        data: { photoUrl: child.photoUrl }
      });
    }

    res.status(400).json({
      success: false,
      message: 'URL de photo requise'
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
// controllers/childController.js - AJOUTER CETTE FONCTION
// @desc    Désassigner un thérapeute d'un enfant
// @route   DELETE /api/children/:id/therapist-assignment
// @access  Private (thérapeute assigné)
exports.removeTherapistAssignment = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier que le thérapeute est assigné
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) {
      return res.status(403).json({
        success: false,
        message: 'Profil thérapeute non trouvé'
      });
    }

    const assignment = await ChildTherapist.findOne({
      childId: child._id,
      therapistId: therapist._id,
      status: 'active'
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas assigné à cet enfant'
      });
    }

    // Mettre à jour le statut ou supprimer l'assignation
    await ChildTherapist.findByIdAndUpdate(assignment._id, {
      status: 'inactive',
      endDate: new Date()
    });

    res.json({
      success: true,
      message: 'Assignation désactivée avec succès'
    });

  } catch (error) {
    console.error('Error removing therapist assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Obtenir les thérapeutes assignés à un enfant
// @route   GET /api/children/:id/therapists
// @access  Private (parent ou thérapeute assigné)
exports.getChildTherapists = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier les permissions
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isTherapist = await checkTherapistAccess(req.user._id, child._id);

    if (!isParent && !isTherapist && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les thérapeutes assignés
    const assignments = await ChildTherapist.find({ 
      childId: child._id,
      status: 'active'
    }).populate({
      path: 'therapistId',
      populate: {
        path: 'userId',
        select: 'email'
      }
    });

    const therapists = assignments.map(assignment => ({
      _id: assignment.therapistId._id,
      user: assignment.therapistId.userId,
      specialization: assignment.therapistId.specialization,
      startDate: assignment.startDate,
      sessionFrequency: assignment.sessionFrequency,
      notes: assignment.notes
    }));

    res.json({
      success: true,
      data: therapists
    });

  } catch (error) {
    console.error('Error fetching child therapists:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = exports;