// 🔥 PUT YOUR REAL BACKEND URL HERE
// If using Render:
const SERVER_URL = "https://your-app-name.onrender.com";

// If running locally, use this instead:
// const SERVER_URL = "http://localhost:5000";

function sendLocation(position) {
    const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: new Date()
    };

    fetch(`${SERVER_URL}/location`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            console.log("Location sent ✅", result);
        })
        .catch(error => {
            console.error("Error sending location ❌", error);
        });
}

function errorHandler(error) {
    alert("Please enable location access.");
    console.error(error);
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(sendLocation, errorHandler, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
