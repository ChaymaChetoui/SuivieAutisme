"# SuivieAutisme" 
# 🧩 Plateforme de Suivi Émotionnel pour Enfants Autistes

Application web MERN complète pour le suivi et l'analyse des émotions d'enfants atteints de troubles du spectre autistique (TSA).

[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-lightgrey)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies Utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du Projet](#-structure-du-projet)
- [API Documentation](#-api-documentation)
- [Utilisation](#-utilisation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contributeurs](#-contributeurs)

---

## ✨ Fonctionnalités

### 👤 Gestion des Utilisateurs
- ✅ Inscription et connexion sécurisée (JWT)
- ✅ Profils parents et thérapeutes
- ✅ Authentification avec tokens persistants

### 👶 Gestion des Enfants
- ✅ Ajout et modification de profils d'enfants
- ✅ Informations détaillées (diagnostic, âge, préférences)
- ✅ Partage de profils avec collaborateurs (thérapeutes)

### 😊 Suivi Émotionnel
- ✅ 7 émotions : joie, tristesse, colère, peur, surprise, neutre, dégoût
- ✅ Sources multiples : observation parentale, caméra NLP, jeux
- ✅ Contexte riche : lieu, déclencheurs, durée, intensité (1-5)
- ✅ Timeline interactive des émotions

### 📊 Analyses et Visualisations
- ✅ Statistiques par période (7, 30, 90 jours)
- ✅ Graphiques d'évolution temporelle
- ✅ Heatmap émotionnelle par jour/heure
- ✅ Identification des patterns et déclencheurs

### 🔒 Sécurité
- ✅ Chiffrement des mots de passe (bcrypt)
- ✅ Tokens JWT avec expiration
- ✅ Validation stricte des données
- ✅ Protection CORS et Helmet

---

## 🛠 Technologies Utilisées

### Frontend
- **React 18** - Bibliothèque UI
- **Vite** - Build tool moderne
- **React Router v6** - Navigation SPA
- **Axios** - Requêtes HTTP
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Icônes modernes
- **React Hot Toast** - Notifications
- **Recharts** - Visualisations de données

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js 4.18** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification
- **Bcrypt.js** - Hachage de mots de passe
- **Express Validator** - Validation des données
- **Helmet** - Sécurité HTTP
- **CORS** - Gestion Cross-Origin

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js) ou **yarn**
- **MongoDB** (local ou Atlas)
- **Git** pour cloner le projet
- Un éditeur de code (VS Code recommandé)

### Vérification des versions

```bash
node --version    # Devrait afficher v18.x.x ou supérieur
npm --version     # Devrait afficher 9.x.x ou supérieur
git --version     # Devrait afficher 2.x.x ou supérieur
```

---

## 🚀 Installation

### 1. Cloner le Projet

```bash
# Via HTTPS
git clone https://github.com/votre-username/autism-tracking-app.git

# Via SSH (recommandé si vous avez configuré vos clés SSH)
git clone git@github.com:votre-username/autism-tracking-app.git

# Accéder au dossier
cd autism-tracking-app
```

### 2. Structure des Dossiers

Le projet contient deux dossiers principaux :

```
autism-tracking-app/
├── backend/          # API Node.js + Express
└── frontend/         # Application React
```

### 3. Installation du Backend

```bash
# Accéder au dossier backend
cd backend

# Installer les dépendances
npm install

# OU avec yarn
yarn install
```

#### Dépendances Backend Installées

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 4. Installation du Frontend

```bash
# Revenir à la racine (si vous êtes dans backend/)
cd ..

# Accéder au dossier frontend
cd frontend

# Installer les dépendances
npm install

# OU avec yarn
yarn install
```

#### Dépendances Frontend Installées

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "react-hot-toast": "^2.4.1",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## ⚙️ Configuration

### 1. Configuration Backend

#### Créer le fichier `.env`

Dans le dossier `backend/`, créez un fichier `.env` :

```bash
cd backend
touch .env  # Linux/Mac
# OU
type nul > .env  # Windows
```

#### Contenu du fichier `.env`

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/autism-tracking
# OU pour MongoDB Atlas :
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/autism-tracking?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=votre_cle_secrete_ultra_securisee_changez_moi_en_production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Optional: File Upload (si vous ajoutez cette fonctionnalité)
# MAX_FILE_SIZE=5242880
```

#### MongoDB Local (Option 1)

**Installation de MongoDB Community Edition :**

**Sur Ubuntu/Debian :**
```bash
# Importer la clé GPG
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Ajouter le repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installer MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Vérifier le statut
sudo systemctl status mongod
```

**Sur macOS (avec Homebrew) :**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Sur Windows :**
- Télécharger depuis [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Installer avec l'assistant
- Démarrer MongoDB Compass

#### MongoDB Atlas (Option 2 - Recommandée)

**Cloud gratuit, pas d'installation :**

1. Créer un compte sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit (M0)
3. Whitelist votre IP : `0.0.0.0/0` (tous) pour développement
4. Créer un utilisateur de base de données
5. Obtenir la connection string :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/autism-tracking
   ```
6. Remplacer dans votre `.env`

### 2. Configuration Frontend

#### Créer le fichier `.env`

Dans le dossier `frontend/`, créez un fichier `.env` :

```bash
cd frontend
touch .env  # Linux/Mac
# OU
type nul > .env  # Windows
```

#### Contenu du fichier `.env`

```env
# API Backend URL
VITE_API_URL=http://localhost:5001

# Optional: Analytics, Error Tracking
# VITE_ANALYTICS_ID=your_analytics_id
```

---

## 🎯 Démarrage

### Option 1 : Démarrage Manuel (2 terminaux)

#### Terminal 1 - Backend

```bash
cd backend
npm run dev

# Le serveur démarre sur http://localhost:5001
```

**Sortie attendue :**
```
🚀 Server running on port 5001
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev

# L'application démarre sur http://localhost:5173
```

**Sortie attendue :**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Option 2 : Démarrage Simultané (avec concurrently)

**À la racine du projet :**

#### Installer concurrently (une seule fois)

```bash
npm install -g concurrently
```

#### Créer un script de démarrage

Créez `package.json` à la racine :

```json
{
  "name": "autism-tracking-fullstack",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
    "install-all": "npm install --prefix backend && npm install --prefix frontend",
    "build": "npm run build --prefix frontend"
  }
}
```

#### Démarrer les deux serveurs

```bash
npm run dev
```

---

## 📁 Structure du Projet

```
autism-tracking-app/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # Configuration MongoDB
│   ├── controllers/
│   │   ├── authController.js        # Logique authentification
│   │   ├── childController.js       # Logique enfants
│   │   └── emotionController.js     # Logique émotions
│   ├── middleware/
│   │   ├── auth.middleware.js       # Vérification JWT
│   │   ├── errorHandler.js          # Gestion erreurs globales
│   │   └── validationMiddleware.js  # Traitement validations
│   ├── models/
│   │   ├── User.js                  # Schéma utilisateur
│   │   ├── Child.js                 # Schéma enfant
│   │   └── Emotion.js               # Schéma émotion
│   ├── routes/
│   │   ├── auth.routes.js           # Routes authentification
│   │   ├── child.routes.js          # Routes enfants
│   │   └── emotion.routes.js        # Routes émotions
│   ├── utils/
│   │   └── validators.js            # Validateurs personnalisés
│   ├── .env                         # Variables d'environnement
│   ├── .gitignore
│   ├── package.json
│   └── server.js                    # Point d'entrée
│
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Composants réutilisables
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Loading.jsx
│   │   │   └── dashboard/
│   │   │       ├── Layout.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Header.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Contexte authentification
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Children.jsx
│   │   │   ├── AddChild.jsx
│   │   │   ├── Emotions.jsx
│   │   │   └── AddEmotion.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Instance Axios configurée
│   │   │   ├── authService.js       # Appels API auth
│   │   │   ├── childService.js      # Appels API enfants
│   │   │   └── emotionService.js    # Appels API émotions
│   │   ├── utils/
│   │   │   └── helpers.js           # Fonctions utilitaires
│   │   ├── App.jsx                  # Composant racine
│   │   ├── main.jsx                 # Point d'entrée
│   │   └── index.css                # Styles globaux
│   ├── .env                         # Variables d'environnement
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Endpoints Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "SecurePass123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "parent"
}

Response 201:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "email": "parent@example.com",
    "firstName": "Jean",
    "role": "parent"
  }
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Endpoints Enfants

#### Liste des enfants
```http
GET /api/children
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

#### Créer un enfant
```http
POST /api/children
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Lucas",
  "lastName": "Dupont",
  "dateOfBirth": "2018-05-15",
  "gender": "male",
  "diagnosis": {
    "type": "Autisme de niveau 1",
    "diagnosedDate": "2020-03-10"
  }
}

Response 201:
{
  "success": true,
  "data": { ... }
}
```

### Endpoints Émotions

#### Enregistrer une émotion
```http
POST /api/emotions
Authorization: Bearer <token>
Content-Type: application/json

{
  "childId": "6579abc...",
  "emotion": "joie",
  "source": "parent_observation",
  "intensity": 4,
  "context": "En jouant avec son jouet préféré",
  "location": "home"
}

Response 201:
{
  "success": true,
  "data": { ... }
}
```

#### Obtenir les émotions d'un enfant
```http
GET /api/emotions/child/6579abc...?limit=50&page=1
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

#### Statistiques
```http
GET /api/emotions/child/6579abc.../stats?days=30
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalEmotions": 45,
    "emotionBreakdown": {...},
    "averageIntensity": 3.2,
    "mostCommon": "joie"
  }
}
```

---

## 💻 Utilisation

### 1. Première Connexion

1. **Accéder à l'application** : http://localhost:5173
2. **S'inscrire** : Cliquer sur "S'inscrire" et créer un compte
3. **Se connecter** : Utiliser vos identifiants

### 2. Ajouter un Enfant

1. Dashboard → "Ajouter un enfant"
2. Remplir le formulaire :
   - Prénom, nom
   - Date de naissance
   - Diagnostic (type, date)
   - Préférences (optionnel)
3. Enregistrer

### 3. Enregistrer une Émotion

1. Sélectionner un enfant
2. Cliquer sur "Enregistrer une émotion"
3. Choisir :
   - L'émotion (joie, tristesse, colère, etc.)
   - L'intensité (1-5)
   - Le contexte
4. Ajouter des détails optionnels
5. Enregistrer

### 4. Visualiser les Statistiques

1. Accéder à la fiche de l'enfant
2. Onglet "Statistiques"
3. Sélectionner la période (7, 30, 90 jours)
4. Explorer :
   - Graphiques d'évolution
   - Répartition des émotions
   - Heatmap temporelle

---

## 🧪 Tests

### Backend Tests

```bash
cd backend

# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests e2e
npm run test:e2e
```

### Frontend Tests

```bash
cd frontend

# Tests unitaires
npm test

# Tests avec watch mode
npm run test:watch
```

---

## 🌐 Déploiement

### Backend - Render.com

1. **Créer un compte** sur [render.com](https://render.com)
2. **Nouveau Web Service**
3. **Connecter le repo GitHub**
4. **Configuration** :
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. **Variables d'environnement** :
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=...
   NODE_ENV=production
   FRONTEND_URL=https://votre-app.vercel.app
   ```

### Frontend - Vercel

1. **Installer Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

2. **Déployer** :
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.onrender.com
   ```

### Alternative : Netlify

```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔧 Dépannage

### Problème : MongoDB ne démarre pas

**Solution** :
```bash
# Vérifier le statut
sudo systemctl status mongod

# Redémarrer
sudo systemctl restart mongod

# Voir les logs
sudo journalctl -u mongod
```

### Problème : Port déjà utilisé

**Solution** :
```bash
# Linux/Mac - Trouver le processus
lsof -i :5001
kill -9 <PID>

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Problème : CORS Error

**Solution** : Vérifier dans `backend/.env` :
```env
FRONTEND_URL=http://localhost:5173
```

### Problème : JWT invalide

**Solution** :
1. Supprimer le token dans localStorage
2. Se reconnecter
3. Vérifier que `JWT_SECRET` est identique

---

## 📝 Scripts Disponibles

### Backend

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "lint": "eslint ."
}
```

### Frontend

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext js,jsx"
}
```

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request



---

## 👨‍💻 Contributeurs

- **Chayma Chetoui** - Développeur Full Stack


---

## 📞 Support

Pour toute question :
- 📧 Email : chaymachetoui2821@gmail.com

---

## 🙏 Remerciements

- Communauté MongoDB
- React Team
- Express.js contributors
- Toutes les familles vivant avec l'autisme

---

**Fait avec ❤️ pour les enfants autistes et leurs familles**