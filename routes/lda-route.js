const express = require('express');

const router = new express.Router();
const lda = require('../controllers/lda-controller');

router.post('/', lda.getTopicModels);
module.exports = router;
