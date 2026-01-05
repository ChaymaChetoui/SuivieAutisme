// routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/emotion', authenticate, chatController.chatEmotion);

module.exports = router;