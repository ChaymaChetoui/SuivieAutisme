// controllers/ai.controller.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Child = require('../models/child');
const EmotionRecord = require('../models/emotionRecord');
const GameSession = require('../models/gameSessions');

// Initialiser Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const calculateEmotionStats = (emotions) => {
  const distribution = {};
  const bySource = {};
  let totalConfidence = 0;
  let confidenceCount = 0;

  emotions.forEach(e => {
    distribution[e.emotion] = (distribution[e.emotion] || 0) + 1;
    bySource[e.source] = (bySource[e.source] || 0) + 1;
    if (e.confidence) {
      totalConfidence += e.confidence;
      confidenceCount++;
    }
  });

  return {
    total: emotions.length,
    distribution,
    bySource,
    avgConfidence: confidenceCount ? totalConfidence / confidenceCount : 0,
    mostFrequent: Object.keys(distribution).sort((a, b) => 
      distribution[b] - distribution[a]
    )[0] || null
  };
};

const calculateGameStats = (sessions) => {
  let totalDuration = 0;
  let totalScore = 0;
  let totalAccuracy = 0;
  const gameTypes = {};

  sessions.forEach(s => {
    totalDuration += s.duration || 0;
    totalScore += s.score || 0;
    totalAccuracy += s.accuracy || 0;
    gameTypes[s.gameType] = (gameTypes[s.gameType] || 0) + 1;
  });

  return {
    totalSessions: sessions.length,
    avgDuration: sessions.length ? totalDuration / sessions.length : 0,
    avgScore: sessions.length ? totalScore / sessions.length : 0,
    avgAccuracy: sessions.length ? totalAccuracy / sessions.length : 0,
    gameTypes
  };
};

// ============================================
// @desc    Générer des insights IA pour un enfant
// @route   POST /api/ai/insights/:childId
// @access  Private
// ============================================
exports.generateInsights = async (req, res) => {
  try {
    const { childId } = req.params;
    const { period = 30 } = req.query;

    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    if (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les données
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [emotions, gameSessions] = await Promise.all([
      EmotionRecord.find({
        childId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 }),
      
      GameSession.find({
        childId,
        startTime: { $gte: startDate }
      })
    ]);

    if (emotions.length === 0 && gameSessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pas assez de données pour générer des insights'
      });
    }

    // Calculer les statistiques
    const emotionStats = calculateEmotionStats(emotions);
    const gameStats = calculateGameStats(gameSessions);

    // Préparer le prompt pour Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const prompt = `
Tu es un expert en autisme et développement émotionnel des enfants. Analyse les données suivantes d'un enfant autiste.

INFORMATIONS DE L'ENFANT:
- Âge: ${calculateAge(child.dateOfBirth)} ans
- Niveau d'autisme: ${child.autismLevel}
- Genre: ${child.gender === 'male' ? 'Garçon' : 'Fille'}

DONNÉES ÉMOTIONNELLES (${period} derniers jours):
- Total d'émotions enregistrées: ${emotionStats.total}
- Distribution: ${JSON.stringify(emotionStats.distribution)}
- Sources: ${JSON.stringify(emotionStats.bySource)}
- Émotion la plus fréquente: ${emotionStats.mostFrequent}

DONNÉES DE JEU ÉDUCATIF:
- Sessions totales: ${gameStats.totalSessions}
- Score moyen: ${gameStats.avgScore.toFixed(1)}/100
- Précision moyenne: ${gameStats.avgAccuracy.toFixed(1)}%
- Durée moyenne par session: ${Math.round(gameStats.avgDuration / 60)} minutes
- Types de jeux: ${JSON.stringify(gameStats.gameTypes)}

TÂCHE:
Fournis une analyse complète en JSON avec cette structure exacte:
{
  "overallProgress": <nombre 0-100>,
  "progressDescription": "<description du progrès global>",
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "areasForImprovement": ["<domaine 1>", "<domaine 2>", "<domaine 3>"],
  "emotionalInsights": "<analyse détaillée des patterns émotionnels>",
  "recommendations": [
    {
      "title": "<titre>",
      "description": "<description détaillée>",
      "priority": "high|medium|low"
    }
  ],
  "nextSteps": ["<étape 1>", "<étape 2>", "<étape 3>"],
  "redFlags": ["<alerte si nécessaire>"] ou null
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parser la réponse
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const insights = JSON.parse(cleanText);

    // Construire la réponse complète
    const analysis = {
      childId,
      childName: `${child.firstName} ${child.lastName}`,
      period: `${period} jours`,
      generatedAt: new Date(),
      dataPoints: {
        totalEmotions: emotions.length,
        totalGameSessions: gameSessions.length,
        avgSessionDuration: Math.round(gameStats.avgDuration / 60),
        emotionDistribution: emotionStats.distribution
      },
      aiInsights: insights,
      rawStats: {
        emotions: emotionStats,
        games: gameStats
      }
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Erreur génération insights:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des insights',
      error: error.message
    });
  }
};

// ============================================
// @desc    Générer des recommandations personnalisées
// @route   POST /api/ai/recommendations/:childId
// @access  Private
// ============================================
exports.getRecommendations = async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les dernières émotions (7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEmotions = await EmotionRecord.find({
      childId,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: -1 }).limit(100);

    // Filtrer les émotions négatives
    const negativeEmotions = recentEmotions.filter(e => 
      ['colère', 'peur', 'tristesse', 'dégoût'].includes(e.emotion)
    );

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
Tu es un thérapeute spécialisé en autisme. Génère des recommandations pratiques pour les parents.

CONTEXTE:
- Enfant: ${calculateAge(child.dateOfBirth)} ans, niveau d'autisme ${child.autismLevel}
- ${negativeEmotions.length} émotions négatives détectées cette semaine
- Émotions: ${negativeEmotions.map(e => `${e.emotion} (${e.context || 'contexte non spécifié'})`).join(', ')}

Génère 5 recommandations concrètes et bienveillantes en JSON:
{
  "recommendations": [
    {
      "title": "<titre court>",
      "description": "<explication détaillée avec exemples concrets>",
      "priority": "high|medium|low",
      "category": "emotion_regulation|communication|sensory|social|routine",
      "actionable": "<action spécifique à prendre>"
    }
  ],
  "encouragement": "<message d'encouragement pour les parents>"
}

Réponds uniquement en JSON valide.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const recommendations = JSON.parse(cleanText);

    res.json({
      success: true,
      data: {
        childId,
        generatedAt: new Date(),
        basedOn: `${negativeEmotions.length} émotions négatives analysées`,
        ...recommendations
      }
    });

  } catch (error) {
    console.error('Erreur recommandations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des recommandations',
      error: error.message
    });
  }
};

// ============================================
// @desc    Analyser les tendances émotionnelles
// @route   GET /api/ai/trends/:childId
// @access  Private
// ============================================
exports.analyzeTrends = async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer 3 mois de données
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const emotions = await EmotionRecord.find({
      childId,
      timestamp: { $gte: threeMonthsAgo }
    }).sort({ timestamp: 1 });

    if (emotions.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Pas assez de données pour analyser les tendances (minimum 10 émotions)'
      });
    }

    // Grouper par semaine
    const weeklyData = {};
    emotions.forEach(e => {
      const date = new Date(e.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { joie: 0, tristesse: 0, colère: 0, peur: 0, surprise: 0, neutre: 0, dégoût: 0 };
      }
      weeklyData[weekKey][e.emotion]++;
    });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
Analyse les tendances émotionnelles hebdomadaires sur 3 mois:

${JSON.stringify(weeklyData, null, 2)}

Identifie en JSON:
{
  "trends": {
    "improving": ["<émotions en amélioration>"],
    "declining": ["<émotions en détérioration>"],
    "stable": ["<émotions stables>"]
  },
  "patterns": ["<patterns temporels observés>"],
  "triggerAnalysis": "<analyse des déclencheurs potentiels>",
  "progressSummary": "<résumé de la progression globale>",
  "weeklyInsight": "<insight sur l'évolution semaine par semaine>"
}

Réponds uniquement en JSON valide.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const trends = JSON.parse(cleanText);

    res.json({
      success: true,
      data: {
        childId,
        period: '3 mois',
        totalDataPoints: emotions.length,
        weeklyData,
        analysis: trends
      }
    });

  } catch (error) {
    console.error('Erreur analyse tendances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des tendances',
      error: error.message
    });
  }
};

// ============================================
// @desc    Générer un rapport de progression complet
// @route   POST /api/ai/report/:childId
// @access  Private
// ============================================
exports.generateProgressReport = async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Vérifier l'accès
    const child = await Child.findById(childId);
    if (!child || (child.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer toutes les données du mois dernier
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [emotions, gameSessions] = await Promise.all([
      EmotionRecord.find({ childId, timestamp: { $gte: oneMonthAgo } }),
      GameSession.find({ childId, startTime: { $gte: oneMonthAgo } })
    ]);

    const emotionStats = calculateEmotionStats(emotions);
    const gameStats = calculateGameStats(gameSessions);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
Génère un rapport de progression mensuel complet pour un enfant autiste.

DONNÉES:
${JSON.stringify({ child: { age: calculateAge(child.dateOfBirth), level: child.autismLevel }, emotionStats, gameStats }, null, 2)}

Crée un rapport structuré en JSON:
{
  "executiveSummary": "<résumé exécutif en 2-3 phrases>",
  "emotionalDevelopment": {
    "score": <0-100>,
    "highlights": ["<point 1>", "<point 2>"],
    "concerns": ["<préoccupation si nécessaire>"]
  },
  "learningProgress": {
    "score": <0-100>,
    "gamePerformance": "<analyse>",
    "skillsAcquired": ["<compétence 1>", "<compétence 2>"]
  },
  "recommendations": ["<recommandation 1>", "<recommandation 2>", "<recommandation 3>"],
  "goalsForNextMonth": ["<objectif 1>", "<objectif 2>", "<objectif 3>"],
  "parentNotes": "<note importante pour les parents>"
}

Réponds uniquement en JSON valide.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const report = JSON.parse(cleanText);

    res.json({
      success: true,
      data: {
        childId,
        childName: `${child.firstName} ${child.lastName}`,
        period: 'Dernier mois',
        generatedAt: new Date(),
        report,
        dataUsed: {
          emotions: emotions.length,
          gameSessions: gameSessions.length
        }
      }
    });

  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
      error: error.message
    });
  }
};

module.exports = exports;