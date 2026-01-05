// backend/test-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiModels() {
  console.log('🔍 Diagnostic des modèles Gemini...\n');
  
  // Vérifiez quelle clé est disponible
  const apiKey = process.env.GEMINI_API_KEY_Chatbot || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERREUR: Aucune clé API Gemini trouvée');
    console.log('📋 Variables d\'environnement disponibles:');
    
    const envVars = Object.keys(process.env);
    const geminiKeys = envVars.filter(key => 
      key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('API')
    );
    
    if (geminiKeys.length === 0) {
      console.log('  Aucune variable GEMINI/GOOGLE trouvée');
    } else {
      geminiKeys.forEach(key => {
        const value = process.env[key];
        const masked = value ? value.substring(0, 10) + '...' : 'NULL';
        console.log(`  ${key}: ${masked}`);
      });
    }
    
    console.log('\n💡 Solution: Ajoutez dans votre .env:');
    console.log('  GEMINI_API_KEY=your_actual_api_key_here');
    return;
  }
  
  console.log('✅ Clé API détectée (premiers caractères):', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Liste des modèles à tester (par ordre de probabilité)
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest",
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest"
    ];
    
    console.log('\n🧪 Test des modèles...\n');
    
    let successfulModel = null;
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`🔄 Test: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: 50,
          }
        });
        
        // Test simple
        const prompt = "Dis bonjour en français";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`   ✅ FONCTIONNE! Réponse: "${text.trim()}"`);
        console.log(`   📊 Modèle valide: ${modelName}\n`);
        
        successfulModel = modelName;
        break; // Arrête au premier succès
        
      } catch (modelError) {
        if (modelError.message.includes('404') || modelError.message.includes('not found')) {
          console.log(`   ❌ Modèle non trouvé: ${modelName}`);
        } else if (modelError.message.includes('permission') || modelError.message.includes('access')) {
          console.log(`   ⚠️ Permission refusée: ${modelName}`);
        } else {
          console.log(`   ❌ Erreur: ${modelError.message.split('\n')[0]}`);
        }
      }
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (successfulModel) {
      console.log(`🎉 SUCCÈS! Utilisez ce modèle: ${successfulModel}`);
      console.log('\n📝 Modifiez votre chatController.js avec:');
      console.log(`   const model = genAI.getGenerativeModel({ model: "${successfulModel}" });`);
    } else {
      console.log('\n❌ Aucun modèle n\'a fonctionné. Vérifiez:');
      console.log('1. Votre clé API est active sur https://makersuite.google.com/app/apikey');
      console.log('2. Les API Gemini sont activées dans Google Cloud Console');
      console.log('3. Vous avez peut-être besoin d\'activer l\'API dans:');
      console.log('   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
      
      // Test direct de l'API
      console.log('\n🔧 Test direct de l\'API...');
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          { method: 'GET' }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Modèles disponibles via API:');
          data.models?.forEach(m => {
            if (m.name.includes('gemini')) {
              console.log(`   - ${m.name.replace('models/', '')} (${m.displayName})`);
            }
          });
        } else {
          console.log(`   ❌ API inaccessible: ${response.status}`);
        }
      } catch (fetchError) {
        console.log(`   ❌ Erreur fetch: ${fetchError.message}`);
      }
    }
    
  } catch (initError) {
    console.error('❌ Erreur initialisation:', initError.message);
  }
}

testGeminiModels();