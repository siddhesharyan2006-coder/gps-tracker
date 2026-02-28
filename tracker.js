const SERVER_URL = "https://gps-tracker-api-wqoy.onrender.com";

function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,     // m/s (can be null)
        timestamp: new Date().toISOString()
    };

    fetch(`${SERVER_URL}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(d => console.log("Location sent ✅", d))
        .catch(e => console.error("Send failed ❌", e));
}

function errorHandler(err) {
    console.error(err);
    alert("Please enable Location access (GPS).");
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(sendLocation, errorHandler, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });
} else {
    alert("Geolocation not supported.");
}