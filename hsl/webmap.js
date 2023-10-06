const L = require("leaflet");
const http = require('http');

const options = {
  hostname: 'localhost', // Replace with the hostname of the server you want to connect to
  port: 3030, // The default HTTP port is 80
  path: '/', // The path to the specific resource you want to access
  method: 'GET', // The HTTP method (GET, POST, etc.)
};

const req = http.request(options, (res) => {
  let data = '';

  // Handle incoming data
  res.on('data', (chunk) => {
    data += chunk;
  });

  // Handle the response
  res.on('end', () => {
    const vpData = JSON.parse(data).VP;
    console.log("Route Number (desi):", vpData.desi);
    console.log("Route Direction (dir):", vpData.dir);
    console.log("Operator ID (oper):", vpData.oper);
    console.log("Vehicle Number (veh):", vpData.veh);
    console.log("Timestamp (tst):", vpData.tst);
    console.log("Unix Timestamp (tsi):", vpData.tsi);
    console.log("Speed (spd):", vpData.spd);
    console.log("Heading (hdg):", vpData.hdg);
    console.log("Latitude (lat):", vpData.lat);
    console.log("Longitude (long):", vpData.long);
  
    // Create a Leaflet circle marker and add it to the map
    const circleMarker = L.circleMarker([vpData.lat, vpData.long]).addTo(map);
    circleMarker.bindPopup(`Route: ${vpData.desi}, Speed: ${vpData.spd}`);
    console.log('Response:', data);
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Error:', error);
});

// Send the request
req.end();

// Creates a Leaflet map bound to an HTML <div> with id "map"
var map = L.map("map").setView([60.1699, 24.9384], 13);

// Adds the basemap tiles to your web map
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 21,
}).addTo(map);
