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
const socket = io('https://ejeep-tracker-project.onrender.com');

socket.on('jeepUpdate', (data) => {
    updateVehicle(data.id, data.lat, data.lon, data.density);
});

// 6. THE VEHICLE ENGINE
function updateVehicle(id, lat, lon, density) {
    // 1. We create the position object just ONCE
    const vehicleLocation = L.latLng(lat, lon); 

    // 2. Add or Move the marker
    if (!jeeps[id]) {
        jeeps[id] = L.marker(vehicleLocation).addTo(map);
    } else {
        jeeps[id].setLatLng(vehicleLocation);
    }

    // 3. Distance & Arrival Logic
    let etaInfo = "GPS Required for ETA";
    if (myLocation) {
        const distMeters = myLocation.distanceTo(vehicleLocation);
        const distKm = (distMeters / 1000).toFixed(1);
        const arrivalMins = Math.round((distKm / 15) * 60);
        etaInfo = `${distKm} km | ${arrivalMins < 1 ? "Arriving" : arrivalMins + " mins"}`;
    }

    // 4. Update the info window
    jeeps[id].bindPopup(`
        <div style="text-align:center;">
            <b>${id}</b><br>
            Density: ${density}<br>
            <span style="color:blue;">${etaInfo}</span>
        </div>
    `);
}