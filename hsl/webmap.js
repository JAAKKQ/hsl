const L = require("leaflet");
const socket = new WebSocket('ws://localhost:3030'); // Connect to a WS server to get position data.

socket.addEventListener('open', (event) => {
    console.log('Connected to the WebSocket server');
});

const markers = new Map(); // Create a map to store postions so that they can be updated

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    const vpData = JSON.parse(data).VP;

    try {
        const { veh, lat, long, desi, spd } = vpData; // Destructure the properties for convenience
        const position = [lat, long]; // Create an array for the position
        const marker = markers.get(veh); // Get the marker for this vehicle number

        // Check if a marker for this vehicle number already exists
        if (marker) {
            // Check if the marker is within the current map bounds
            if (map.getBounds().contains(position)) {
                // Update the existing marker's position and popup content
                marker.setLatLng(position);
                marker.getPopup().setContent(`Route: ${desi}, Speed: ${spd * 10}`);
            }
        } else {
            // Check if the position is within the current map bounds
            if (map.getBounds().contains(position)) {
                // Create a new marker and add it to the map and the Map object
                const circleMarker = L.circleMarker(position, {
                    radius: 10, // Adjust the radius to your desired size
                }).addTo(map);
                circleMarker.bindPopup(`Route: ${desi}, Speed: ${spd * 10}`);
                markers.set(veh, circleMarker); // Store the marker using the vehicle number as the key
            }
        }
        localStorage.setItem('mapCenter', JSON.stringify(map.getCenter()));
        localStorage.setItem('mapZoom', map.getZoom());
    } catch (err) {
        // Handle any errors
        //console.error(err);
    }
});

// Check if map center and zoom level are saved in local storage
const savedMapCenter = JSON.parse(localStorage.getItem('mapCenter'));
const savedMapZoom = parseInt(localStorage.getItem('mapZoom'));

// Creates a Leaflet map bound to an HTML <div> with id "map"
var map = L.map("map", {
    center: savedMapCenter || [60.1699, 24.9384], // Use saved center or default
    zoom: savedMapZoom || 13, // Use saved zoom level or default
  });


socket.addEventListener('close', (event) => {
    console.log('Connection closed');
});

// Adds the basemap tiles to your web map
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 21,
}).addTo(map);
