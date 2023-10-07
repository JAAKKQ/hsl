var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mqtt = require("mqtt");
const client = mqtt.connect("mqtts://mqtt.hsl.fi:8883/");
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server Running');
  });

const wss = new WebSocket.Server({ server });

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

function broadcastData(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

client.on("connect", () => {
    client.subscribe("/hfp/v2/journey/#", (err) => {
        if (!err) {

        }
    });
});

client.on("message", (topic, message) => {
    // message is Buffer, convert it to a string
    const messageString = message.toString();
    broadcastData(messageString);
});

const port = process.env.PORT || 3030;
server.listen(port, () => {
  console.log(`WebSocket server are running on port ${port}`);
});

module.exports = app;