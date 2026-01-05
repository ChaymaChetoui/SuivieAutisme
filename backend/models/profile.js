// models/Profile.js
// RELATION 1-TO-1 AVEC USER
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Assure qu'un user n'a qu'un seul profil (1-to-1)
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
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Numéro invalide']
  },
  avatar: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Tunisia'
    }
  },
  preferredLanguage: {
    type: String,
    enum: ['fr', 'ar', 'en'],
    default: 'fr'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Maximum 500 caractères']
  }
}, {
  timestamps: true
});

// ============================================
// MÉTHODE : Nom complet
// ============================================
profileSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// ============================================
// INDEX pour recherche rapide
// ============================================
profileSchema.index({ userId: 1 });
profileSchema.index({ firstName: 1, lastName: 1 });

profileSchema.set('toJSON', { virtuals: true });
profileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Profile', profileSchema);