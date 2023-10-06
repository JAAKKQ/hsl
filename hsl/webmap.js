const L = require("leaflet");
const socket = new WebSocket('ws://localhost:3030'); // Replace with the actual WebSocket server URL

socket.addEventListener('open', (event) => {
  console.log('Connected to the WebSocket server');
});

const markers = {}; // Store markers using vehicle numbers as keys

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    const vpData = JSON.parse(data).VP;

    try {
        // Check if a marker for this vehicle number already exists
        if (markers[vpData.veh]) {
            // Check if the marker is within the current map bounds
            if (map.getBounds().contains([vpData.lat, vpData.long])) {
                // Update the existing marker's position
                markers[vpData.veh].setLatLng([vpData.lat, vpData.long]);
            } else {
                // Marker is outside the viewport, remove it from the map
                map.removeLayer(markers[vpData.veh]);
                delete markers[vpData.veh];
            }
        } else {
            // Check if the marker is within the current map bounds
            if (map.getBounds().contains([vpData.lat, vpData.long])) {
                // Create a new marker and add it to the map
                const circleMarker = L.circleMarker([vpData.lat, vpData.long], {
                    radius: 5, // Adjust the radius to your desired size
                }).addTo(map);
                circleMarker.bindPopup(`Route: ${vpData.desi}, Speed: ${vpData.spd}`);
                markers[vpData.veh] = circleMarker; // Store the marker using the vehicle number as the key
            }
        }
    } catch (err) {
        console.error(err);
    }
});



socket.addEventListener('close', (event) => {
  console.log('Connection closed');
});

// Creates a Leaflet map bound to an HTML <div> with id "map"
var map = L.map("map").setView([60.1699, 24.9384], 13);

// Adds the basemap tiles to your web map
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 21,
}).addTo(map);
