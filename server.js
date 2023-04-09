const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// app.use(express.static(path.join(__dirname, 'public')));

app.all('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'public'));
});

console.log(__dirname)

app.listen(port);
console.log('Server started at http://localhost:' + port);