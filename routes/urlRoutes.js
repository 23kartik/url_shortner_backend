const express = require('express');
const router = express.Router();
const { shortenUrl,bulkShortenUrls, redirectUrl, handlePostRedirect } = require('../controllers/urlController');

router.post('/shorten', shortenUrl);
router.post('/bulk-shorten', bulkShortenUrls); 
router.get('/:shortCode', redirectUrl);
router.post('/:shortCode', handlePostRedirect); // Handle POST requests for password submission

module.exports = router;
