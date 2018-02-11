function vizzy() {
    const express = require('express');
    const bodyParser = require('body-parser');
    const fs = require('fs');
    const app = express();
    const port = 35872;
    let cssString;
    fs.readFile(__dirname + '/demo/main.css', 'utf8', function (err, data) {
        cssString = data;
        console.log('Vizzy is watching for changes!')
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.text());
    app.use(bodyParser.json({ type: 'application/json' }));
    app.post('/', function (req, res) {
        cssString = cssString.replace(/\s/g, '').replace(/\r/g, '');
        let start = cssString.indexOf(req.body.selector + '{');
        let end = cssString.indexOf('}', start);
        let newRule = req.body.selector + JSON.stringify(req.body.values).replace(/\,/g, ';').replace(/\"/g, '');
        cssString = cssString.slice(0, start) + newRule + cssString.slice(end + 1, cssString.length);
        fs.writeFile(__dirname + '/demo/main.css', cssString, function (err) {
            if (!err) {
                console.log('Vizzy CSS Updated!')
                console.log('Vizzy - CSS for rule "' + req.body.selector + '" updated!')
                res.status(200).send({ filePath: 'main.css' });
            } else {
                throw err;
            }
        });
    });
    app.listen(port);
}
module.exports = vizzy();