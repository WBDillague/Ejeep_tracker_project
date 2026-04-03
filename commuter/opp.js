// 1. INITIALIZE THE MAP (THE FOUNDATION)
const map = L.map('map', {
    zoomControl: false, 
    tap: true           
}).setView([14.5995, 120.9842], 14);

// 2. THE TILE LAYER (THE VISUALS) - THIS IS WHAT YOU WERE MISSING
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. UI CONTROLS
L.control.zoom({ position: 'bottomright' }).addTo(map);

// 4. DATA STORAGE
const jeeps = {}; 
let myLocation = null;

// 5. BACKEND CONNECTION (RADIO TOWER)
const socket = io('https://ejeep-tracker-project.onrender.com');

socket.on('jeepUpdate', (data) => {
    updateVehicle(data.id, data.lat, data.lon, data.density);
});

socket.on('initialData', (allJeeps) => {
    for (let id in allJeeps) {
        const jeep = allJeeps[id];
        updateVehicle(id, jeep.lat, jeep.lon, jeep.density);
    }
});

// 6. USER LOCATION LOGIC
map.locate({ setView: true, watch: true, maxZoom: 16 });

map.on('locationfound', (e) => {
    myLocation = e.latlng;
    document.getElementById('user-status').innerText = "Live";
    
    if (!window.userMarker) {
        window.userMarker = L.circleMarker(e.latlng, {
            radius: 7, fillColor: "#64ffda", color: "white", weight: 2, fillOpacity: 1
        }).addTo(map);
    } else {
        window.userMarker.setLatLng(e.latlng);
    }
});

// 7. THE VEHICLE UPDATE ENGINE (Make sure this function is defined!)
function updateVehicle(id, lat, lon, density) {
    const newPos = [lat, lon];
    const densityConfig = {
        "low": { color: "#198754", label: "Low" },
        "mid": { color: "#fd7e14", label: "Medium" },
        "full": { color: "#dc3545", label: "Full" },
        "overloaded": { color: "#000000", label: "Overloaded" }
    };
    const config = densityConfig[density] || { color: "gray", label: "Unknown" };

    if (!jeeps[id]) {
        jeeps[id] = L.marker(newPos).addTo(map);
        document.getElementById('vehicle-count').innerText = Object.keys(jeeps).length;
    } else {
        // Only works if you have the sliding marker plugin linked in HTML
        if (jeeps[id].slideTo) {
            jeeps[id].slideTo(newPos, { duration: 2000 });
        } else {
            jeeps[id].setLatLng(newPos);
        }
    }

    // Set the Popup Content
    const content = `<div style="text-align:center; color:black;">
        <b>${id}</b><br>
        <span style="color:${config.color}">Density: ${config.label}</span>
    </div>`;
    jeeps[id].bindPopup(content);
}