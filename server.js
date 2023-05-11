const express = require('express'),
    fs = require('fs'),					// and the filesystem library	
    url = require('url'),
    bodyParser = require('body-parser');
// const path = require('path');
// app.use(express.static(path.join(__dirname, 'public')));

const app = express();

var currentData = {};						// set up a variable to hold the data
app.use(express.urlencoded({ extended: false })); 			// use express' urlencoded middleware

app.use(express.static("public")); // this line tells the express app to 'serve' the public folder to clients


// HTTP will expose our server to the web
const http = require("http").createServer(app);

// start our server listening on port 8080 for now (this is standard for HTTP connections)
const server = app.listen(8080);
console.log("Server is running on http://localhost:8080");




// respond to GET request for data
app.get('/data', function (request, response) {
    // the file to the data file on the server:
    var filePath = __dirname + '/comment.txt';

    /* read the file  asynchronously.
       the second parameter of readFile is 
       the callback function that's called when
       readFile completes:
     */
    fs.readFile(filePath, function (error, data) {
        // if something goes wrong, throw an error:
        if (error) throw error;

        // if you have a successful file read, print it
        // to the client:
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write("Here's what's in the data.txt file: <br>");
        response.write(data.toString());
        response.write("<br><a href=\"/\">Return to form</a>");
        response.end();
    });
});



// respond to POST request to update data:
app.post('/post', function (request, response) {
    // because you're using the urlencoded middleware,
    // you can ask for pieces of the request like this:
    currentData.name = request.body.name;
    currentData.duration = request.body.duration;

    // get the path to the data file: 
    var filePath = __dirname + '/comment.txt';
    // convert the data, currently a JSON object, to a string:
    var dataString = JSON.stringify(currentData);

    // this function is called by by the writeFile and appendFile functions 
    // below:
    function fileWriteResponse() {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        console.log(currentData);
        response.write("<div class='commentRespones'>Thanks for your comment! </div>");
        response.end();
        console.log('comment submitted')
    }
    /* 
           write to the file asynchronously. THe third parameter of 
           writeFile is the callback function that's called when
           you've had a successful write. 
    */
    fs.exists(filePath, function (exists) {
        if (exists) {
            fs.appendFile(filePath, dataString);
        } else {
            fs.writeFile(filePath, dataString);
        }
    });
});