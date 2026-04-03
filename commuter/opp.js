// 1. INITIALIZE THE MAP (THE FOUNDATION)
const map = L.map('map', {
    zoomControl: false,
    fadeAnimation: true, // Makes tile loading look smoother
    markerZoomAnimation: true
}).setView([14.5995, 120.9842], 11); // Start zoomed out slightly for speed

// 2. Use a faster Tile Server (Optional but helpful)
// OpenStreetMap is great, but sometimes 'CartoDB Positron' loads faster 
// because it has fewer colors/details to download.
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '©OpenStreetMap ©CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

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
// Locate the user IMMEDIATELY
map.locate({ 
    setView: true,      // Automatically jumps the camera to the user
    maxZoom: 16,        // High detail zoom for the "first glance"
    watch: true,        // Keep tracking as they walk
    enableHighAccuracy: true 
});

// This handles the "First Glance" zoom speed
map.on('locationfound', (e) => {
    myLocation = e.latlng;
    
    // If it's the first time loading, the 'setView' above handles it.
    // We add a subtle pulse to the user marker so they know they are the center.
    if (!window.userMarker) {
        window.userMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: "#64ffda",
            color: "white",
            weight: 3,
            fillOpacity: 1
        }).addTo(map);
        
        // Force a quick flyTo for that "Professional App" feel
        map.flyTo(e.latlng, 16, {
            animate: true,
            duration: 1.5 // 1.5 seconds to zoom in from Manila view to Street view
        });
    } else {
        window.userMarker.setLatLng(e.latlng);
    }
    
    document.getElementById('user-status').innerText = "Live";
});

// 7. THE VEHICLE UPDATE ENGINE (Make sure this function is defined!)
function updateVehicle(id, lat, lon, density) {
    const newPos = L.latLng(lat, lon); // Create a Leaflet LatLng object
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

    // Update the Popup with a cleaner design
    const content = `
        <div style="text-align:center; font-family: sans-serif; color: #333;">
            <strong style="font-size: 1.1rem;">${id}</strong><br>
            <span style="color: #666;">Status: ${density.toUpperCase()}</span><br>
            <hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;">
            <span style="color: #0d6efd; font-weight: bold;">${etaText}</span>
        </div>
    `;
    
    jeeps[id].bindPopup(content);
	
	// NEW: Calculate distance if user location is known
    let etaText = "Enable GPS to see ETA";
    if (myLocation) {
        const stats = calculateETA(myLocation, newPos);
        etaText = `<b>${stats.dist}</b> | ${stats.time}`;
    }
}

function calculateETA(latlng1, latlng2) {
    if (!latlng1 || !latlng2) return "Location unknown";

    // 1. Get distance in meters
    const meters = latlng1.distanceTo(latlng2);
    
    // 2. Convert to Kilometers
    const km = (meters / 1000).toFixed(1);

    // 3. Estimate Time (Average E-Jeep speed in Manila traffic is ~15 km/h)
    // Formula: (Distance / Speed) * 60 minutes
    const minutes = Math.round((km / 15) * 60);

    return {
        dist: km + " km away",
        time: minutes < 1 ? "Arriving now" : minutes + " mins away"
    };
}