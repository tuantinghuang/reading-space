const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

// app.all('/*', function (req, res) {
//     res.sendFile(path.join(__dirname, 'public'));
// });

console.log(__dirname)

let server = app.listen(port);
console.log('Server started at http://localhost:' + port);






/////SOCKET.IO///////
const io = require("socket.io")().listen(server);

const peers = {};

io.on("connection", (socket) => {
    console.log(
        "Someone joined our server using socket.io.  Their socket id is",
        socket.id
    );

    peers[socket.id] = {};

    console.log("Current peers:", peers);

    socket.on("msg", (data) => {
        console.log("Got message from client with id ", socket.id, ":", data);
        let messageWithId = { from: socket.id, data: data };
        socket.broadcast.emit("msg", messageWithId);
    });

    socket.on("disconnect", () => {
        console.log("Someone with ID", socket.id, "left the server");
        delete peers[socket.id];
    });
});