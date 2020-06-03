const express = require('express');

module.exports = function(app) {
    const index = require('../controllers/index.server.controller');

    const sentimentRoute = require('../routes/sentiment-route');
    const ldaRoute = require('../routes/lda-route');

    app.use('/text/v1/sentiment', sentimentRoute);
    app.use('/text/v1/topics', ldaRoute);

    // static files
    app.use(express.static('/static'));
};
