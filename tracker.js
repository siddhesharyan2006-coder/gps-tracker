const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

let watchId = null;
let started = false;

const statusEl = document.getElementById("status");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

function setStatus(t) { statusEl.textContent = t; }

async function sendEvent(type) {
    try {
        const r = await fetch(`${SERVER_URL}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, timestamp: new Date().toISOString() })
        });
        const txt = await r.text();
        console.log("EVENT:", type, r.status, txt);
    } catch (e) {
        console.error("EVENT failed:", e);
    }
}

async function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ?? 0,
        timestamp: new Date().toISOString()
    };

    try {
        const r = await fetch(`${SERVER_URL}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const j = await r.json();
        console.log("LOCATION:", j);
    } catch (e) {
        console.error("LOCATION failed:", e);
    }
}

function onGeoError(err) {
    console.error(err);
    setStatus("Status: Location permission/GPS error ❌");
    alert("Enable Location permission + turn ON GPS.");
}

function startTracking() {
    if (started) return;
    if (!navigator.geolocation) {
        alert("Geolocation not supported on this device/browser.");
        return;
    }

    started = true;
    setStatus("Status: Tracking started ✅");

    // Start a new trip on server + reset points
    sendEvent("START");

    watchId = navigator.geolocation.watchPosition(
        sendLocation,
        onGeoError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

function stopTracking() {
    if (!started) return;

    started = false;
    setStatus("Status: Tracking stopped 🛑");

    // mark destination on server
    sendEvent("STOP");

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// Wire buttons (this is the key fix)
btnStart.addEventListener("click", startTracking);
btnStop.addEventListener("click", stopTracking);

// Optional: show loaded
console.log("tracker.js loaded ✅");