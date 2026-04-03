// 1. GLOBAL VARIABLES
const jeeps = {};
let myLocation = null;
let firstLoad = true;

// 2. INITIALIZE MAP (No fancy animations to prevent lag)
const map = L.map('map', {
    zoomControl: false,
    fadeAnimation: false
}).setView([14.5995, 120.9842], 13);

// 3. ADD TILES (The visuals)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 4. USER LOCATION LOGIC
map.locate({ setView: false, watch: true, enableHighAccuracy: true });

map.on('locationfound', (e) => {
    myLocation = e.latlng;
    
    // Jump to user only on first load to make it feel fast
    if (firstLoad) {
        map.setView(e.latlng, 16);
        firstLoad = false;
    }

    if (!window.userMarker) {
        window.userMarker = L.circleMarker(e.latlng, {
            radius: 7, fillColor: "#64ffda", color: "white", weight: 2, fillOpacity: 1
        }).addTo(map);
    } else {
        window.userMarker.setLatLng(e.latlng);
    }
    
    document.getElementById('user-status').innerText = "Live";
});

// 5. SERVER CONNECTION (The Radio Tower)
const socket = io('https://ejeep-backend.onrender.com');

socket.on('jeepUpdate', (data) => {
    updateVehicle(data.id, data.lat, data.lon, data.density);
});

// 6. THE VEHICLE ENGINE
function updateVehicle(id, lat, lon, density) {
    // We only declare it ONCE using a Leaflet object
    const currentVehiclePos = L.latLng(lat, lon); 
    
    if (!jeeps[id]) {
        jeeps[id] = L.marker(currentVehiclePos).addTo(map);
    } else {
        jeeps[id].setLatLng(currentVehiclePos);
    }

    let etaText = "Calculating...";
    if (myLocation) {
        const meters = myLocation.distanceTo(currentVehiclePos);
        const km = (meters / 1000).toFixed(1);
        const mins = Math.round((km / 15) * 60);
        etaText = `${km} km away | ${mins < 1 ? "Arriving" : mins + " mins"}`;
    }

    jeeps[id].bindPopup(`<b>${id}</b><br>Density: ${density}<br>${etaText}`);
}