// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Minimum 8 caractères'],
    select: false // Ne pas retourner le password par défaut
  },
  role: {
    type: String,
    enum: ['parent', 'therapist', 'admin'],
    default: 'parent'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true // Ajoute createdAt et updatedAt
});

// ============================================
// MIDDLEWARE PRE-SAVE : Hash le mot de passe
// ============================================
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// ============================================
// MÉTHODE : Comparer les mots de passe
// ============================================
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur de comparaison de mot de passe');
  }
};

// ============================================
// MÉTHODE : Retourner un objet user sans password
// ============================================
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

// ============================================
// RELATIONS VIRTUELLES
// ============================================

// Relation 1-to-1 avec Profile
userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Relation 1-to-Many avec Children
userSchema.virtual('children', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'parentId'
});

// Activer les virtuals dans JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);