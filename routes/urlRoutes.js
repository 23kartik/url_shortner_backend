const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// Route to shorten URL
router.post('/shorten', urlController.shortenUrl);

// Route to redirect URL
router.get('/:shortCode', urlController.redirectUrl);

module.exports = router;
