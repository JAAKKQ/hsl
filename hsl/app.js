var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mqtt = require("mqtt");
const client = mqtt.connect("mqtts://mqtt.hsl.fi:8883/");
const socketIo = require("socket.io");
const http = require("http");

const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3030;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

client.on("connect", () => {
    client.subscribe("/hfp/v2/journey/#", (err) => {
        if (!err) {
           
        }
    });
});

client.on("message", (topic, message) => {
    // message is Buffer, convert it to a string
    const messageString = message.toString();
    try {
        const vpData = JSON.parse(messageString).VP;

        io.emit("data-update", messageString);
    } catch (error) {
        console.error("Ei tietoa.");
        console.log('-------------------------------');
    }
});


io.on("connection", (socket) => {
    console.log("A client connected");
    socket.on("disconnect", () => {
        console.log("A client disconnected");
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

module.exports = app;