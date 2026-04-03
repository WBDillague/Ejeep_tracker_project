const SERVER_URL = "https://ejeep-tracker-project.onrender.com/update-jeep";
const JEEP_ID = "MNL-EJEEP-001"; 

let currentDensity = "low";
let isTracking = false;
let watchID = null;

function setDensity(level, btnElement) {
    currentDensity = level;
    // Remove active class from all
    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
    // Add to clicked
    btnElement.classList.add('active');
}

function toggleTracking() {
    const btn = document.getElementById('toggle-btn');
    
    if (!isTracking) {
        if ("geolocation" in navigator) {
            isTracking = true;
            btn.innerText = "STOP DRIVING";
            btn.classList.add('stop');
            
            // Watch position tracks real-time movement
            watchID = navigator.geolocation.watchPosition(sendUpdate, handleError, {
                enableHighAccuracy: true,
                maximumAge: 0
            });
        } else {
            alert("GPS not supported on this device.");
        }
    } else {
        isTracking = false;
        btn.innerText = "START DRIVING";
        btn.classList.remove('stop');
        navigator.geolocation.clearWatch(watchID);
        document.getElementById('gps-status').innerText = "OFFLINE";
    }
}

async function sendUpdate(position) {
    const payload = {
        id: JEEP_ID,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        density: currentDensity
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            document.getElementById('gps-status').innerText = "ACTIVE";
            document.getElementById('last-sent').innerText = new Date().toLocaleTimeString();
        }
    } catch (err) {
        document.getElementById('gps-status').innerText = "SERVER ERROR";
    }
}

function handleError(error) {
    console.error(error);
    document.getElementById('gps-status').innerText = "GPS ERROR";
}