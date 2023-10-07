const L = require("leaflet");
require('dotenv').config();
const socket = new WebSocket(WS_URL); // Connect to a WS server to get position data.

socket.addEventListener('open', (event) => {
    console.log('Connected to the WebSocket server');
    socket.send(JSON.stringify({ type: "getStops", latlon: map.getCenter() }));
});

// Define constants for map center and zoom
const MAP_CENTER_KEY = 'mapCenter';
const MAP_ZOOM_KEY = 'mapZoom';

const addedStops = new Map();

// Initialize markers object to store vehicle markers
const markers = new Map();

// Define a function to update markers
function updateMarker(data) {
    const { veh, lat, long, desi, spd } = data;
    const position = [lat, long];

    if (!map.getBounds().contains(position)) {
        return; // Marker is out of bounds, no need to update or create it
    }

    let marker = markers.get(veh);

    if (!marker) {
        // Create a new marker if it doesn't exist
        const circleMarker = L.circleMarker(position, {
            radius: 20, // Adjust the radius to your desired size
        }).addTo(map);

        circleMarker.bindPopup(`Route: ${desi}, Speed: ${spd * 3.6}`);

        const textLabel = L.divIcon({
            className: 'text-label',
            html: `<p>${desi}</p>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
        });

        const textMarker = L.marker(position, {
            icon: textLabel,
        }).addTo(map);

        textMarker.bindPopup(`Route: ${desi}, Speed: ${spd * 3.6}`);

        marker = { circleMarker, textMarker };
        markers.set(veh, marker);
    } else {
        // Update existing marker's position and popup content
        marker.circleMarker.setLatLng(position);
        marker.textMarker.setLatLng(position);
        marker.circleMarker.getPopup().setContent(`Route: ${desi}, Speed: ${spd * 3.6}`);
        marker.textMarker.getPopup().setContent(`Route: ${desi}, Speed: ${spd * 3.6}`);
    }
}

// Add an event listener for WebSocket messages
socket.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log(data.type);

        switch (data.type) {
            case "position":
                const vpData = JSON.parse(data.data).VP;
                if (vpData) {
                    updateMarker(vpData);
                    // Store map center and zoom in local storage
                    localStorage.setItem(MAP_CENTER_KEY, JSON.stringify(map.getCenter()));
                    localStorage.setItem(MAP_ZOOM_KEY, map.getZoom());
                }
                break;
            case "stops":
                // Remove old stops
                for (const [gtfsId, marker] of addedStops.entries()) {
                    map.removeLayer(marker);
                    addedStops.delete(gtfsId);
                }

                // Add new stops
                for (const nodedata of data.data) {
                    const stop = nodedata.node.stop;
                    const latLng = L.latLng(stop.lat, stop.lon);

                    // Check if the stop is within the current map viewport
                    if (!addedStops.has(stop.gtfsId)) {
                        const marker = L.circleMarker(latLng, {
                            radius: 5,
                            color: 'red',
                        }).addTo(map);
                        marker.bindPopup(stop.name);

                        // Mark this stop as added in the Map
                        addedStops.set(stop.gtfsId, marker);
                    }
                }

                break;
            default:
                break;
        }

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

map.on('moveend', () => {
    socket.send(JSON.stringify({ type: "getStops", latlon: map.getCenter() }));
});

socket.addEventListener('close', (event) => {
    console.log('Connection closed');
});

// Adds the basemap tiles to your web map
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attribution/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 21,
}).addTo(map);

