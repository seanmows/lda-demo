const http = require('http');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true
    })
);
app.use(
    bodyParser.json({
        limit: '50mb',
        extended: true
    })
);

app.use("/static", express.static(__dirname + "/static"));

// Routing
require(path.join(__dirname+'/routes/index.server.routes.js'))(app);

// default URL for website
app.use('/', function(req,res){
    res.sendFile(path.join(__dirname+'/static/index.html'));
});

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);