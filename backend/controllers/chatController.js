// controllers/chatController.js - Version avec gestion de quota
const { GoogleGenerativeAI } = require('@google/generative-ai');
const EmotionRecord = require('../models/emotionRecord');

const apiKey = process.env.GEMINI_API_KEY_Chatbot;
const genAI = new GoogleGenerativeAI(apiKey);

// Essayez CES modèles dans l'ordre (certains ont plus de quota)
const MODEL_PRIORITY = [
  "gemini-2.0-flash-lite",        // ✅ Modèle léger, plus de quota
  "gemini-2.0-flash-lite-001",    // ✅ Version spécifique du lite
  "gemini-flash-lite-latest",     // ✅ Dernière version lite
  "gemini-2.5-flash-lite",        // ✅ Nouvelle version lite
  "gemini-2.0-flash",             // Modèle standard (peut avoir moins de quota)
  "gemini-pro-latest"             // Dernière version pro
];

console.log('🤖 Gemini configuré - Gestion de quota activée');

exports.chatEmotion = async (req, res) => {
  console.log('📩 Requête chat reçue !');
  console.log('Body:', req.body);

  try {
    const { message, childId } = req.body;

    if (!message || !childId) {
      return res.status(400).json({ message: 'Message et childId requis' });
    }

    console.log(`🧒 Enfant: ${childId} | Message: "${message}"`);

    let lastError = null;
    let successfulResponse = null;
    let usedModel = null;

    // Essayez les modèles par ordre de priorité
    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`🤖 Tentative avec modèle: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 120, // Réduit pour économiser des tokens
          }
        });

        const prompt = `Tu es Rusty le Renard 🦊, assistant pour enfants.
Réponds avec douceur et empathie en 2 phrases maximum.
Utilise des emojis.

Enfant: "${message.trim()}"
Réponse:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Nettoyage
        text = text.replace(/^[^a-zA-ZÀ-ÿ]*/, '').trim();

        successfulResponse = text;
        usedModel = modelName;
        console.log(`✅ Succès avec ${modelName}:`, text.substring(0, 50) + '...');
        break; // Stop au premier succès

      } catch (error) {
        lastError = error;
        if (error.message.includes('quota') || error.message.includes('429')) {
          console.log(`⚠️ Quota dépassé pour ${modelName}, essaye suivant...`);
          continue; // Essaye le modèle suivant
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          console.log(`❌ Modèle ${modelName} non disponible`);
          continue;
        } else {
          // Autre erreur - on arrête
          throw error;
        }
      }
    }

    // Si aucun modèle n'a fonctionné
    if (!successfulResponse) {
      console.error('💥 Tous les modèles ont échoué:', lastError?.message);
      
      // Fallback : réponse locale
      const fallbackResponses = [
        "Oh ! Je t'entends mon petit ami ! 🦊✨ Comment te sens-tu aujourd'hui ?",
        "Salut ! C'est Rusty le renard ! 🦊❤️ Tu veux me parler de quelque chose ?",
        "Bonjour ! Je suis là pour t'écouter. 🦊🌟 Dis-moi ce qui se passe ?",
        "Coucou ! Je suis ton ami renard. 🦊💫 Comment s'est passée ta journée ?"
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      successfulResponse = randomResponse;
      usedModel = "fallback-local";
      
      console.log('🔄 Utilisation de réponse de fallback');
    }

    // Détection émotion (simplifiée)
    let detectedEmotion = 'neutre';
    const lower = message.toLowerCase();
    if (/bonjour|salut|coucou|hello|hi/.test(lower)) detectedEmotion = 'accueil';
    else if (/content|heureux|joie|génial|super/.test(lower)) detectedEmotion = 'joie';
    else if (/triste|pleure|mal|désolé/.test(lower)) detectedEmotion = 'tristesse';

    // Enregistrement
    try {
      await EmotionRecord.create({
        childId,
        emotion: detectedEmotion,
        source: 'chat',
        context: message,
        intensity: 3,
        notes: `Modèle: ${usedModel} | Réponse: ${successfulResponse.substring(0, 100)}`,
        isFallback: usedModel === "fallback-local"
      });
      console.log(`💾 Enregistré: ${detectedEmotion} (${usedModel})`);
    } catch (dbError) {
      console.error('⚠️ Erreur DB:', dbError.message);
    }

    res.json({ 
      response: successfulResponse,
      emotion: detectedEmotion,
      model: usedModel,
      isFallback: usedModel === "fallback-local"
    });

  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    
    // Réponse de secours même en cas d'erreur
    const fallbackResponses = [
      "Je suis un peu fatigué aujourd'hui... 🦊💤 Mais je suis là pour toi !",
      "Oups ! J'ai du mal à réfléchir. 🦊✨ Parle-moi encore, s'il te plaît !",
      "Mon cerveau de renard fait des siestes ! 🦊😴 Réessaye dans un instant !"
    ];
    
    res.json({
      response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      emotion: 'neutre',
      model: 'fallback-error',
      isFallback: true
    });
  }
};