const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

let watchId = null;
let isTracking = false;

const statusEl = document.getElementById("status");

function setStatus(text) {
    if (statusEl) statusEl.innerText = text;
}

function sendEvent(type) {
    // Send an event so viewer can mark start/stop properly
    return fetch(`${SERVER_URL}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type, // "START" or "STOP"
            timestamp: new Date().toISOString()
        })
    }).catch(() => { });
}

function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed, // m/s (can be null)
        timestamp: new Date().toISOString()
    };

    fetch(`${SERVER_URL}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(() => setStatus("Status: Tracking ON ✅"))
        .catch(() => setStatus("Status: Sending failed ❌ (check internet)"));
}

function errorHandler(err) {
    console.error(err);
    alert("Please enable Location permission and turn ON GPS.");
}

window.startTracking = async function startTracking() {
    if (isTracking) return;

    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    setStatus("Status: Starting...");
    await sendEvent("START");

    watchId = navigator.geolocation.watchPosition(
        sendLocation,
        errorHandler,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    isTracking = true;
    setStatus("Status: Tracking ON ✅");
};

window.stopTracking = async function stopTracking() {
    if (!isTracking) return;

    setStatus("Status: Stopping...");
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);

    await sendEvent("STOP");

    isTracking = false;
    watchId = null;
    setStatus("Status: Tracking OFF 🛑");
};

// default
setStatus("Status: Not started");