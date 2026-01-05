// models/GameSession.js
// RELATION 1-TO-MANY AVEC CHILD (Un enfant a plusieurs sessions de jeu)
const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  gameType: {
    type: String,
    enum: [
      'emotion_recognition',    // Reconnaître les émotions sur des visages
      'expression_practice',    // Pratiquer l'expression d'émotions
      'social_scenarios',       // Scénarios sociaux interactifs
      'emotion_matching',       // Associer émotions à des situations
      'story_telling'          // Histoires avec émotions
    ],
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // en secondes
    default: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  maxScore: {
    type: Number,
    default: 100
  },
  emotionsLearned: [{
    type: String,
    enum: ['joie', 'tristesse', 'colère', 'peur', 'surprise', 'neutre', 'dégoût']
  }],
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  attemptsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  successCount: {
    type: Number,
    default: 0,
    min: 0
  },
  failureCount: {
    type: Number,
    default: 0,
    min: 0
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  completed: {
    type: Boolean,
    default: false
  },
  hintsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  pauseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ============================================
// MIDDLEWARE PRE-SAVE
// ============================================

// Calculer la durée automatiquement
gameSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Calculer l'accuracy
  if (this.attemptsCount > 0) {
    this.accuracy = Math.round((this.successCount / this.attemptsCount) * 100);
  }
  
  next();
});

// ============================================
// VIRTUALS
// ============================================

// Pourcentage de score
gameSessionSchema.virtual('scorePercentage').get(function() {
  if (this.maxScore === 0) return 0;
  return Math.round((this.score / this.maxScore) * 100);
});

// Temps moyen par tentative
gameSessionSchema.virtual('avgTimePerAttempt').get(function() {
  if (this.attemptsCount === 0) return 0;
  return Math.round(this.duration / this.attemptsCount);
});

// ============================================
// RELATIONS VIRTUELLES
// ============================================

// Relation avec GameActivity (1-to-Many)
gameSessionSchema.virtual('activities', {
  ref: 'GameActivity',
  localField: '_id',
  foreignField: 'sessionId'
});

// ============================================
// INDEX
// ============================================
gameSessionSchema.index({ childId: 1, startTime: -1 });
gameSessionSchema.index({ childId: 1, gameType: 1 });
gameSessionSchema.index({ childId: 1, completed: 1 });

// ============================================
// MÉTHODES STATIQUES
// ============================================

// Obtenir les statistiques de jeu pour un enfant
gameSessionSchema.statics.getGameStats = async function(childId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        childId: mongoose.Types.ObjectId(childId),
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$gameType',
        totalSessions: { $sum: 1 },
        avgScore: { $avg: '$score' },
        avgAccuracy: { $avg: '$accuracy' },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);
};

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

// Terminer une session
gameSessionSchema.methods.complete = function() {
  this.completed = true;
  this.endTime = new Date();
  return this.save();
};

gameSessionSchema.set('toJSON', { virtuals: true });
gameSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('GameSession', gameSessionSchema);