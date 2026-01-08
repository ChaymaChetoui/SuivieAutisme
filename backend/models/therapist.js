// models/Therapist.js
const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    enum: [
      'autism_specialist',
      'speech_therapist',
      'occupational_therapist',
      'behavioral_therapist',
      'psychologist',
      'psychiatrist'
    ]
  },
  licenseNumber: {
    type: String,
    required: [true, 'Numéro de licence requis'],
    unique: true,
    trim: true
  },
  experience: {
    type: Number, // années d'expérience
    required: true,
    min: [0, 'L\'expérience ne peut pas être négative']
  },
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: String,
    year: Number,
    field: String
  }],
  bio: {
    type: String,
    maxlength: [1000, 'Maximum 1000 caractères']
  },
  certifications: [{
    name: String,
    issuedBy: String,
    year: Number
  }],
  languages: [{
    type: String,
    enum: ['français', 'arabe', 'anglais', 'autre']
  }],
  availability: {
    monday: [String],
    tuesday: [String],
    wednesday: [String],
    thursday: [String],
    friday: [String],
    saturday: [String],
    sunday: [String]
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ============================================
// RELATIONS VIRTUELLES (Many-to-Many via ChildTherapist)
// ============================================

therapistSchema.virtual('assignments', {
  ref: 'ChildTherapist',
  localField: '_id',
  foreignField: 'therapistId'
});

// ============================================
// INDEX
// ============================================
therapistSchema.index({ userId: 1 });
therapistSchema.index({ specialization: 1, isActive: 1 });

therapistSchema.set('toJSON', { virtuals: true });
therapistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Therapist', therapistSchema);


// ============================================
// models/ChildTherapist.js
// TABLE DE LIAISON POUR RELATION MANY-TO-MANY
// ============================================
