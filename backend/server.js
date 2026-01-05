// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importer la connexion DB
const connectDB = require('./config/database');

// Importer les routes
const routes = require('./routes');

// ============================================
// INITIALISATION
// ============================================
const app = express();

// Connexion à MongoDB
connectDB();

// ============================================
// MIDDLEWARE DE SÉCURITÉ
// ============================================

// Helmet - sécurise les headers HTTP
app.use(helmet());

// CORS - Configuration des origines autorisées
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: {
    success: false,
    message: 'Trop de requêtes, réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// LOGGING (développement)
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.use('/api/chat', require('./routes/chat.routes'));

app.get('/health', (req, res) => {
  res.json({
    status: '✅ OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'connected'
  });
});

// Routes principales
app.use('/', routes);

// Route 404 - Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '❌ Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// GESTION GLOBALE DES ERREURS
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);

  if (err.code === 11000) { // Duplicate key
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Ce ${field} existe déjà`
    });
  }

  if (err.name === 'ValidationError') { // Mongoose validation
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }

  if (err.name === 'JsonWebTokenError') { // JWT
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  if (err.name === 'CastError') { // ID MongoDB invalide
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('🚀 Serveur démarré avec succès!');
  console.log('═══════════════════════════════════════════');
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════\n');
});

// ============================================
// GESTION PROPRE DE L'ARRÊT
// ============================================
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('🔴 Serveur fermé');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('🔴 Serveur fermé');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
