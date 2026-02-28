const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

let watchId = null;
let started = false;

const statusEl = document.getElementById("status");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

function setStatus(t) { statusEl.textContent = t; }

async function sendEvent(type) {
    const res = await fetch(`${SERVER_URL}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, timestamp: new Date().toISOString() })
    });
    return res.json();
}

async function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ?? 0,
        timestamp: new Date().toISOString()
    };

    await fetch(`${SERVER_URL}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

function onGeoError(err) {
    console.error(err);
    setStatus("Status: GPS/Permission error ❌");
    alert("Enable Location permission + turn ON GPS.");
}

async function startTracking() {
    if (started) return;
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    started = true;
    setStatus("Status: Started ✅");

    try { await sendEvent("START"); } catch (e) { console.error(e); }

    watchId = navigator.geolocation.watchPosition(
        sendLocation,
        onGeoError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

async function stopTracking() {
    if (!started) return;

    started = false;
    setStatus("Status: Stopped 🛑");

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    try { await sendEvent("STOP"); } catch (e) { console.error(e); }
}

btnStart.addEventListener("click", startTracking);
btnStop.addEventListener("click", stopTracking);

console.log("tracker.js loaded ✅");