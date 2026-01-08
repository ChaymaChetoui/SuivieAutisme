const mongoose = require('mongoose');

const childTherapistSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startDate;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'on_hold'],
    default: 'active'
  },
  sessionFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  completedSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: [2000, 'Maximum 2000 caractères']
  },
  goals: [{
    description: {
      type: String,
      required: true
    },
    targetDate: Date,
    achieved: {
      type: Boolean,
      default: false
    },
    achievedDate: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  lastSessionDate: Date,
  nextSessionDate: Date
}, {
  timestamps: true
});

// ============================================
// INDEX UNIQUE pour éviter les doublons
// ============================================
childTherapistSchema.index({ childId: 1, therapistId: 1 }, { unique: true });
childTherapistSchema.index({ status: 1 });
childTherapistSchema.index({ childId: 1, status: 1 });
childTherapistSchema.index({ therapistId: 1, status: 1 });

// ============================================
// VIRTUALS
// ============================================

// Pourcentage de sessions complétées
childTherapistSchema.virtual('completionRate').get(function() {
  if (this.totalSessions === 0) return 0;
  return Math.round((this.completedSessions / this.totalSessions) * 100);
});

// Durée de la thérapie en jours
childTherapistSchema.virtual('durationInDays').get(function() {
  const end = this.endDate || new Date();
  const start = this.startDate;
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
});

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

// Ajouter une session
childTherapistSchema.methods.addSession = function() {
  this.totalSessions += 1;
  this.completedSessions += 1;
  this.lastSessionDate = new Date();
  return this.save();
};

// Mettre à jour un objectif
childTherapistSchema.methods.updateGoal = function(goalId, updates) {
  const goal = this.goals.id(goalId);
  if (goal) {
    Object.assign(goal, updates);
    if (updates.achieved && !goal.achievedDate) {
      goal.achievedDate = new Date();
    }
    return this.save();
  }
  throw new Error('Objectif non trouvé');
};

childTherapistSchema.set('toJSON', { virtuals: true });
childTherapistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChildTherapist', childTherapistSchema);