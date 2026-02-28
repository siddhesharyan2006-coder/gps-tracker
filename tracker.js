const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

let watchId = null;
let started = false;

const statusEl = document.getElementById("status");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

function setStatus(t) { statusEl.textContent = t; }

async function sendEvent(type) {
    try {
        await fetch(`${SERVER_URL}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, timestamp: new Date().toISOString() })
        });
    } catch (e) { }
}

async function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ?? 0,
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(`${SERVER_URL}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (e) { }
}

function onGeoError(err) {
    console.error(err);
    setStatus("Status: GPS/Permission error ❌");
    alert("Enable Location permission + turn ON GPS.");
}

function startTracking() {
    if (started) return;
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    started = true;
    setStatus("Status: Started ✅");          // ✅ change 1

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
    setStatus("Status: Stopped 🛑");          // ✅ change 2

    sendEvent("STOP");

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

btnStart.addEventListener("click", startTracking);
btnStop.addEventListener("click", stopTracking);

setStatus("Status: Not started");