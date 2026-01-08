// models/Child.js
// RELATION 1-TO-MANY AVEC USER (Un parent a plusieurs enfants)
const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: [true, 'Prénom requis'],
    trim: true,
    minlength: [2, 'Minimum 2 caractères'],
    maxlength: [50, 'Maximum 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true,
    minlength: [2, 'Minimum 2 caractères'],
    maxlength: [50, 'Maximum 50 caractères']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date de naissance requise']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  autismLevel: {
    type: String,
    enum: ['léger', 'modéré', 'sévère'],
    required: [true, 'Niveau d\'autisme requis']
  },
  diagnosticDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value <= new Date();
      },
      message: 'La date de diagnostic ne peut pas être dans le futur'
    }
  },
  photo: {
    type: String,
    default: null
  },
  medicalNotes: {
    type: String,
    maxlength: [2000, 'Maximum 2000 caractères']
  },
  
  // CORRECTION : Mettre à jour les allergies pour accepter des objets
  allergies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Déjà correct
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: String,
    frequency: String,
    prescribedBy: String,  // AJOUTER
    startDate: Date
  }],
  
  // CORRECTION : Mettre à jour les besoins spéciaux
  specialNeeds: [{
    type: {
      type: String,
      required: true,
      enum: ['communication', 'social', 'behavioral', 'sensory', 'learning', 'physical', 'medical']
    },
    description: {
      type: String,
      trim: true
    },
    accommodations: [{
      type: String,
      trim: true
    }]
  }],

  // Login code
  loginCode: {
    type: String,
    required: true,
    unique: true,
    minlength: [6, 'Le code doit contenir exactement 6 chiffres'],
    maxlength: [6, 'Le code doit contenir exactement 6 chiffres'],
    match: [/^\d{6}$/, 'Le code doit contenir uniquement des chiffres']
  },
  loginCodeActive: {
    type: Boolean,
    default: true
  },
  
  displayName: {
    type: String,
    trim: true,
    default: function() {
      return this.firstName;
    }
  }
}, {
  timestamps: true
});

// ============================================
// VIRTUALS
// ============================================

// Calculer l'âge automatiquement
childSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Nom complet
childSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Nom utilisé dans l'app mobile (priorité à displayName)
childSchema.virtual('childName').get(function() {
  return this.displayName || this.firstName || 'Petit Champion';
});

// ============================================
// RELATIONS VIRTUELLES (1-to-Many)
// ============================================

childSchema.virtual('emotions', {
  ref: 'EmotionRecord',
  localField: '_id',
  foreignField: 'childId'
});

childSchema.virtual('gameSessions', {
  ref: 'GameSession',
  localField: '_id',
  foreignField: 'childId'
});

// ============================================
// INDEX
// ============================================
childSchema.index({ parentId: 1, createdAt: -1 });
childSchema.index({ firstName: 1, lastName: 1 });
childSchema.index({ loginCode: 1 }); // Très important pour recherche rapide par code

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);