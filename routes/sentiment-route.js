const express = require('express');

const router = new express.Router();
const sentiment = require('../controllers/sentiment-controller');

router.post('/', sentiment.getSentiment);
module.exports = router;
