var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mqtt = require("mqtt");
const client = mqtt.connect("mqtts://mqtt.hsl.fi:8883/");
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

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

wss.on('connection', async (ws) => {
    console.log('A client connected');

    ws.on('message', async (message) => {
        try {
            const requestData = JSON.parse(message); // Use a different variable name
            switch (requestData.type) {
                case "getStops":
                    const stops = await getStops(requestData.latlon);
                    ws.send(JSON.stringify({ type: "stops", data: stops }));
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    

    // Handle client disconnection
    ws.on('close', () => {
        console.log('A client disconnected');
    });
});

client.on("connect", () => {
    client.subscribe("/hfp/v2/journey/#", (err) => {
    });
});

client.on("message", (topic, message) => {
    // message is Buffer, convert it to a string
    const messageString = message.toString();
    broadcastData("position", messageString);
});

function broadcastData(type, data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({type: type, data: data}));
        }
    });
}

async function getStops(latlon) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/graphql',
            'digitransit-subscription-key': process.env.API_KEY,
        },
        body: `{ stopsByRadius(lat:${latlon.lat}, lon:${latlon.lng}, radius:10000) { edges { node { stop { gtfsId name lat lon } distance } } } }`, // Convert the query to a JSON string
    };

    // Make the GraphQL query using fetch and return the result
    try {
        const response = await fetch('https://api.digitransit.fi/routing/v1/routers/finland/index/graphql', requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.stopsByRadius.edges;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error to handle it higher up the call stack if needed
    }
}


const port = process.env.WS_PORT || 3030;
server.listen(port, () => {
    console.log(`WebSocket server are running on port ${port}`);
});

module.exports = app;