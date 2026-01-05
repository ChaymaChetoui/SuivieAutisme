// models/EmotionRecord.js
// RELATION 1-TO-MANY AVEC CHILD (Un enfant a plusieurs enregistrements d'émotions)
const mongoose = require('mongoose');

const emotionRecordSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  emotion: {
    type: String,
    enum: ['joie', 'tristesse', 'colère', 'peur', 'surprise', 'neutre', 'dégoût'],
    required: [true, 'Émotion requise']
  },
  source: {
    type: String,
    enum: ['camera_nlp', 'game', 'manual', 'parent_observation', 'chat'],
    required: [true, 'Source requise']
  },
  confidence: {
    type: Number,
    min: [0, 'Minimum 0'],
    max: [100, 'Maximum 100'],
    default: null // Null si pas de détection NLP
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  context: {
    type: String,
    maxlength: [500, 'Maximum 500 caractères'],
    trim: true
  },
  imageUrl: {
    type: String // URL de l'image capturée par la caméra
  },
  location: {
    type: String,
    enum: ['home', 'school', 'therapy', 'public', 'other'],
    default: 'home'
  },
  triggers: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Maximum 1000 caractères'],
    trim: true
  },
  intensity: {
    type: Number,
    min: 1,
    max: 5, // Échelle de 1 (faible) à 5 (très forte)
    default: 3
  },
  duration: {
    type: Number, // Durée en minutes
    min: 0
  },
  resolution: {
    type: String,
    enum: ['self-regulated', 'parent-help', 'timeout', 'distraction', 'other'],
    default: null
  }
}, {
  timestamps: true
});

// ============================================
// INDEX COMPOSÉS pour recherches optimisées
// ============================================
emotionRecordSchema.index({ childId: 1, timestamp: -1 });
emotionRecordSchema.index({ childId: 1, emotion: 1 });
emotionRecordSchema.index({ childId: 1, source: 1, timestamp: -1 });

// ============================================
// MÉTHODES STATIQUES
// ============================================

// Obtenir les statistiques d'émotions pour un enfant
emotionRecordSchema.statics.getEmotionStats = async function(childId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        childId: mongoose.Types.ObjectId(childId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$emotion',
        count: { $sum: 1 },
        avgIntensity: { $avg: '$intensity' },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

// Vérifier si c'est une émotion négative
emotionRecordSchema.methods.isNegativeEmotion = function() {
  return ['tristesse', 'colère', 'peur', 'dégoût'].includes(this.emotion);
};

emotionRecordSchema.set('toJSON', { virtuals: true });
emotionRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EmotionRecord', emotionRecordSchema);