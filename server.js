function vizzy () {
    const express = require('express');
    const bodyParser = require('body-parser');
    const fs = require('fs');
    const app = express();
    const port = 35872;
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.text());
    app.use(bodyParser.json({ type: 'application/json' }));
    app.post('/', function (req, res) {
        console.log('received', req.body.rules);
        res.status(200).send();
    });
    app.listen(port);    
}
module.exports = vizzy();