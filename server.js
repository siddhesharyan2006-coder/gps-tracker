const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// serve frontend from /public
app.use(express.static(path.join(__dirname, "public")));

let locations = [];
let trip = {
    startedAt: null,
    startPoint: null,
    stoppedAt: null,
    stopPoint: null
};

app.get("/", (req, res) => res.send("Server is running ✅"));

// receive location points
app.post("/location", (req, res) => {
    const { latitude, longitude, speed, timestamp } = req.body;

    const record = {
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    // If trip started but startPoint not set yet, set it from first location
    if (trip.startedAt && !trip.startPoint) {
        trip.startPoint = { latitude: record.latitude, longitude: record.longitude };
    }

    // If trip already stopped, ignore further points (optional safety)
    if (trip.stoppedAt) {
        return res.json({ message: "Trip already stopped. Ignoring location." });
    }

    locations.push(record);
    res.json({ message: "Location saved ✅" });
});

// receive start/stop events
app.post("/event", (req, res) => {
    const { type, timestamp } = req.body;
    const time = timestamp || new Date().toISOString();

    if (type === "START") {
        // new trip: reset
        locations = [];
        let trip = {
            startedAt: null,
            startPoint: null,
            stoppedAt: null,
            stopPoint: null
        };
        return res.json({ message: "Trip started ✅", trip });
    }

    if (type === "STOP") {
        trip.stoppedAt = time;

        // set stop point as latest known location
        const last = locations[locations.length - 1];
        if (last) {
            trip.stopPoint = { latitude: last.latitude, longitude: last.longitude };
        }
        return res.json({ message: "Trip stopped ✅", trip });
    }

    res.status(400).json({ message: "Invalid event type" });
});

// viewer pulls this
app.get("/locations", (req, res) => res.json(locations));
app.get("/trip", (req, res) => res.json(trip));

// optional reset
app.get("/reset", (req, res) => {
    locations = [];
    trip = { startedAt: null, startPoint: null, stoppedAt: null, stopPoint: null };
    res.json({ message: "Reset ✅" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));