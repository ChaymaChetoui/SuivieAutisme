// models/Child.js
// RELATION 1-TO-MANY AVEC USER (Un parent a plusieurs enfants)
const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index pour recherche rapide
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
    required: [true, 'Date de naissance requise'],
    validate: {
      validator: function(value) {
        // L'enfant doit avoir entre 0 et 18 ans
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        const monthDiff = today.getMonth() - value.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
          return age - 1 >= 0 && age - 1 <= 18;
        }
        return age >= 0 && age <= 18;
      },
      message: 'L\'enfant doit avoir entre 0 et 18 ans'
    }
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
        // La date de diagnostic ne peut pas être après aujourd'hui
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
  allergies: [{
    type: String,
    trim: true
  }],
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    startDate: Date
  }],
  specialNeeds: [{
    type: String,
    trim: true
  }],

  // ============================================
  // AJOUTS INDISPENSABLES POUR LE CODE MAGIQUE
  // ============================================
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

  // Nom affiché dans l'app enfant (plus simple que prénom + nom)
  displayName: {
    type: String,
    trim: true,
    default: function() {
      return this.firstName; // Par défaut le prénom
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