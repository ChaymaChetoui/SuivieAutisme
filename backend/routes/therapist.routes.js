const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const User = require('../models/user');
const Profile = require('../models/profile');
const Child = require('../models/child');
const ChildTherapist = require('../models/childTherapist');
const Therapist = require('../models/Therapist');

// Toutes les routes nécessitent l'authentification thérapeute
router.use(authenticate);
router.use(authorize('therapist'));

// ============================================
// @desc    Rechercher des parents
// @route   GET /api/therapist/search-parents
// @access  Private (Therapist)
// ============================================
router.get('/search-parents', async (req, res) => {
  try {
    const { q } = req.query;

    const query = { role: 'parent' };
    
    if (q) {
      query.$or = [
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const parents = await User.find(query)
      .select('email createdAt')
      .limit(20);

    // Enrichir avec les profils
    const parentsWithProfiles = await Promise.all(
      parents.map(async (parent) => {
        const profile = await Profile.findOne({ userId: parent._id });
        return {
          _id: parent._id,
          email: parent.email,
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          phone: profile?.phone || ''
        };
      })
    );

    res.json({
      success: true,
      data: parentsWithProfiles
    });

  } catch (error) {
    console.error('Error searching parents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
});

router.delete('/patients/:childId', async (req, res) => {
  try {
    const { childId } = req.params;

    console.log('Unassign request - therapist:', req.user._id, 'child:', childId);

    // 1. Trouver le profil thérapeute
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Profil thérapeute non trouvé'
      });
    }

    // 2. Vérifier que l'enfant existe
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // 3. Chercher la relation ChildTherapist existante
    const assignment = await ChildTherapist.findOne({
      childId: child._id,
      therapistId: therapist._id,
      status: 'active'
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Cet enfant n\'est pas assigné à vous'
      });
    }

    // 4. Option 1: Supprimer complètement la relation
    // await assignment.deleteOne();

    // Option 2: Mettre le status à "inactive" (recommandé pour garder l'historique)
    assignment.status = 'inactive';
    assignment.endDate = new Date();
    await assignment.save();

    console.log('Assignment removed/inactivated:', assignment._id);

    res.json({
      success: true,
      message: 'Vous avez été désassigné de cet enfant',
      data: {
        childId: child._id,
        childName: `${child.firstName} ${child.lastName}`,
        unassignedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error unassigning patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désassignation',
      error: error.message
    });
  }
});

// ============================================
// @desc    Créer un enfant et l'assigner à un parent + thérapeute
// @route   POST /api/therapist/children
// @access  Private (Therapist)
// ============================================
// ============================================
// @desc    Créer un enfant et l'assigner à un parent + thérapeute
// @route   POST /api/therapist/children
// @access  Private (Therapist)
// ============================================
router.post('/children', async (req, res) => {
  try {
    const { parentId, loginCode, ...childData } = req.body;

    console.log('Received data:', { parentId, loginCode, ...childData });

    // 1. Vérifier que le parent existe
    const parent = await User.findOne({ _id: parentId, role: 'parent' });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }

    // 2. Vérifier l'unicité du loginCode
    if (loginCode) {
      const existingChild = await Child.findOne({ loginCode });
      if (existingChild) {
        return res.status(400).json({
          success: false,
          message: 'Ce code de connexion est déjà utilisé',
          field: 'loginCode'
        });
      }
    }

    // 3. Transformer les données
    const transformedData = {
      ...childData,
      allergies: Array.isArray(childData.allergies) 
        ? childData.allergies.map(a => 
            typeof a === 'object' && a.name ? a.name : String(a)
          ).filter(Boolean)
        : [],
      specialNeeds: Array.isArray(childData.specialNeeds)
        ? childData.specialNeeds.map(n => 
            typeof n === 'object' && n.type ? n.type : String(n)
          ).filter(Boolean)
        : []
    };

    // 4. Créer l'enfant
    const child = await Child.create({
      ...transformedData,
      parentId: parent._id,
      loginCode: loginCode || undefined
    });

    console.log('Child created:', child._id);

    // 5. Trouver ou créer le profil thérapeute
    let therapist = await Therapist.findOne({ userId: req.user._id });
    
    if (!therapist) {
      console.log('Creating therapist profile for user:', req.user._id);
      
      // Créer un profil thérapeute minimal
      try {
        therapist = await Therapist.create({
          userId: req.user._id,
          specialization: 'autism_specialist',
          licenseNumber: `TEMP-${req.user._id.toString().slice(-6)}-${Date.now().toString().slice(-6)}`,
          experience: 0,
          isActive: true,
          bio: 'Profil créé automatiquement',
          languages: ['français']
        });
        
        console.log('Therapist profile created:', therapist._id);
      } catch (therapistError) {
        console.error('Error creating therapist profile:', therapistError);
        
        // Si erreur de création du therapist, on peut quand même créer l'enfant
        // mais sans relation ChildTherapist pour l'instant
        return res.status(201).json({
          success: true,
          message: 'Enfant créé mais profil thérapeute incomplet. Veuillez compléter votre profil.',
          data: {
            child: {
              _id: child._id,
              firstName: child.firstName,
              lastName: child.lastName,
              dateOfBirth: child.dateOfBirth,
              parentId: child.parentId,
              loginCode: child.loginCode
            },
            warning: 'Profil thérapeute à compléter'
          }
        });
      }
    }

    console.log('Using therapist:', therapist._id);

    // 6. Créer la relation ChildTherapist
    try {
      const childTherapist = await ChildTherapist.create({
        childId: child._id,
        therapistId: therapist._id,
        startDate: new Date(),
        status: 'active',
        sessionFrequency: 'weekly'
      });

      console.log('ChildTherapist created:', childTherapist._id);

      res.status(201).json({
        success: true,
        message: 'Enfant créé et assigné avec succès',
        data: {
          child: {
            _id: child._id,
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth,
            parentId: child.parentId,
            loginCode: child.loginCode
          },
          parent: {
            _id: parent._id,
            email: parent.email
          },
          therapist: {
            _id: therapist._id,
            specialization: therapist.specialization
          },
          assignment: {
            _id: childTherapist._id,
            status: childTherapist.status
          }
        }
      });
      
    } catch (assignmentError) {
      console.error('Error creating ChildTherapist:', assignmentError);
      
      // Si erreur de création ChildTherapist, on retourne quand même l'enfant créé
      res.status(201).json({
        success: true,
        message: 'Enfant créé mais erreur lors de l\'assignation au thérapeute',
        data: {
          child: {
            _id: child._id,
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth,
            parentId: child.parentId,
            loginCode: child.loginCode
          },
          warning: 'Assignation à compléter manuellement'
        }
      });
    }

  } catch (error) {
    console.error('Error in /children route:', error);

    // Gestion des erreurs
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const field = Object.keys(error.keyPattern || {})[0];
      let message = 'Erreur de duplication';
      
      if (field === 'loginCode') {
        message = 'Ce code de connexion est déjà utilisé';
      } else if (field === 'licenseNumber') {
        message = 'Numéro de licence déjà utilisé';
      }
      
      return res.status(400).json({
        success: false,
        message,
        field: field || 'unknown'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ============================================
// @desc    Obtenir mes patients (via ChildTherapist)
// @route   GET /api/therapist/patients
// @access  Private (Therapist)
// ============================================
router.get('/patients', async (req, res) => {
  try {
    // Trouver le profil thérapeute
    const therapist = await Therapist.findOne({ userId: req.user._id });
    
    if (!therapist) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Trouver toutes les relations actives
    const assignments = await ChildTherapist.find({
      therapistId: therapist._id,
      status: 'active'
    }).populate('childId');

    // Extraire les enfants
    const children = assignments
      .map(a => a.childId)
      .filter(child => child !== null);

    res.json({
      success: true,
      data: children
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
});
// ============================================
// @desc    Assigner un enfant existant au thérapeute
// @route   POST /api/therapist/assign-child
// @access  Private (Therapist)
// ============================================
router.post('/assign-child', async (req, res) => {
  try {
    const { childId, parentId } = req.body;

    // Vérifier que l'enfant existe et appartient au parent
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé ou n\'appartient pas au parent spécifié'
      });
    }

    // Trouver ou créer le profil thérapeute
    let therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) {
      therapist = await Therapist.create({
        userId: req.user._id,
        specialization: 'autism_specialist',
        licenseNumber: `TEMP-${Date.now()}`,
        experience: 1
      });
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await ChildTherapist.findOne({
      childId: child._id,
      therapistId: therapist._id
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Cet enfant est déjà assigné à ce thérapeute'
      });
    }

    // Créer la nouvelle assignation
    const childTherapist = await ChildTherapist.create({
      childId: child._id,
      therapistId: therapist._id,
      startDate: new Date(),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Enfant assigné au thérapeute avec succès',
      data: childTherapist
    });

  } catch (error) {
    console.error('Error assigning child:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});
// ============================================
// @desc    Compléter le profil thérapeute
// @route   POST /api/therapist/complete-profile
// @access  Private (Therapist)
// ============================================
router.post('/complete-profile', async (req, res) => {
  try {
    const { specialization, licenseNumber, experience, ...otherData } = req.body;

    // Vérifier si le profil existe déjà
    const existingTherapist = await Therapist.findOne({ userId: req.user._id });
    if (existingTherapist) {
      return res.status(400).json({
        success: false,
        message: 'Profil déjà complété'
      });
    }

    // Créer le profil
    const therapist = await Therapist.create({
      userId: req.user._id,
      specialization,
      licenseNumber,
      experience: parseInt(experience) || 0,
      ...otherData,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Profil thérapeute créé avec succès',
      data: therapist
    });

  } catch (error) {
    console.error('Error creating therapist profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Middleware pour vérifier que le thérapeute a un profil
const checkTherapistProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user._id });
    
    if (!therapist) {
      return res.status(400).json({
        success: false,
        message: 'Profil thérapeute incomplet. Veuillez compléter votre profil d\'abord.',
        redirect: '/therapist/complete-profile'
      });
    }
    
    req.therapist = therapist;
    next();
  } catch (error) {
    console.error('Error checking therapist profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Appliquer le middleware aux routes qui nécessitent un profil complet
router.use(checkTherapistProfile);

// ============================================
// @desc    Obtenir les enfants non assignés à ce thérapeute
// @route   GET /api/therapist/unassigned-children
// @access  Private (Therapist)
// ============================================
router.get('/unassigned-children', async (req, res) => {
  try {
    // Trouver le profil thérapeute
    const therapist = await Therapist.findOne({ userId: req.user._id });
    
    if (!therapist) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Trouver tous les enfants qui ne sont PAS assignés à ce thérapeute
    const assignedChildIds = await ChildTherapist.find({
      therapistId: therapist._id
    }).distinct('childId');

    const unassignedChildren = await Child.find({
      _id: { $nin: assignedChildIds }
    }).populate('parentId', 'email');

    res.json({
      success: true,
      data: unassignedChildren
    });

  } catch (error) {
    console.error('Error fetching unassigned children:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ============================================
// @desc    Obtenir les statistiques thérapeute
// @route   GET /api/therapist/stats
// @access  Private (Therapist)
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user._id });
    
    if (!therapist) {
      return res.json({
        success: true,
        data: {
          totalPatients: 0,
          activeSessions: 0,
          completedSessions: 0,
          pendingReports: 0
        }
      });
    }

    // Compter les patients
    const totalPatients = await ChildTherapist.countDocuments({
      therapistId: therapist._id,
      status: 'active'
    });

    const activeSessions = await ChildTherapist.countDocuments({
      therapistId: therapist._id,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        activeSessions,
        completedSessions: 0, // TODO: implémenter quand vous aurez les sessions
        pendingReports: 0
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
});

module.exports = router;


// =============================================
// backend/routes/index.js (AJOUTER)
// =============================================
// Ajouter cette ligne dans routes/index.js :

const therapistRoutes = require('./therapist.routes');
router.use('/api/therapist', therapistRoutes);