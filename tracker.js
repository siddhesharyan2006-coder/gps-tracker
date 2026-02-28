const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

let watchId = null;
let started = false;

function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || 0,
        timestamp: new Date().toISOString()
    };

    fetch(`${SERVER_URL}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => console.log("Location sent ✅", data))
        .catch(err => console.error("Error sending location ❌", err));
}

function errorHandler(error) {
    alert("Please enable location access.");
    console.error(error);
}

window.startTracking = function () {
    if (started) return;

    started = true;
    document.getElementById("status").innerText = "Status: Tracking started";

    fetch(`${SERVER_URL}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "START", timestamp: new Date().toISOString() })
    });

    watchId = navigator.geolocation.watchPosition(sendLocation, errorHandler, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
    });
};

window.stopTracking = function () {
    if (!started) return;

    started = false;
    document.getElementById("status").innerText = "Status: Tracking stopped";

    fetch(`${SERVER_URL}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "STOP", timestamp: new Date().toISOString() })
    });

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
};