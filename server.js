const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Store per trackerId
// sessions[trackerId] = { locations: [], trip: {startedAt,...} }
const sessions = {};

function ensureSession(id) {
    if (!sessions[id]) {
        sessions[id] = {
            locations: [],
            trip: { startedAt: null, startPoint: null, stoppedAt: null, stopPoint: null }
        };
    }
    return sessions[id];
}

app.get("/", (req, res) => res.send("Server is running ✅"));

// ✅ Save location for specific trackerId
app.post("/location/:id", (req, res) => {
    const id = req.params.id;
    const s = ensureSession(id);

    const { latitude, longitude, speed, timestamp } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ message: "Invalid coordinates" });
    }

    if (s.trip.stoppedAt) return res.json({ message: "Trip already stopped. Ignoring." });

    const record = {
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    if (s.trip.startedAt && !s.trip.startPoint) {
        s.trip.startPoint = { latitude: record.latitude, longitude: record.longitude };
    }

    s.locations.push(record);
    res.json({ message: "Location saved ✅" });
});

// ✅ START/STOP for specific trackerId
app.post("/event/:id", (req, res) => {
    const id = req.params.id;
    const s = ensureSession(id);

    const { type, timestamp } = req.body;
    const time = timestamp || new Date().toISOString();

    if (type === "START") {
        s.locations = [];
        s.trip = { startedAt: time, startPoint: null, stoppedAt: null, stopPoint: null };
        return res.json({ message: "Trip started ✅", trip: s.trip });
    }

    if (type === "STOP") {
        s.trip.stoppedAt = time;
        const last = s.locations[s.locations.length - 1];
        if (last) s.trip.stopPoint = { latitude: last.latitude, longitude: last.longitude };
        return res.json({ message: "Trip stopped ✅", trip: s.trip });
    }

    res.status(400).json({ message: "Invalid event type" });
});

// ✅ Viewer fetch endpoints
app.get("/locations/:id", (req, res) => {
    const id = req.params.id;
    const s = ensureSession(id);
    res.json(s.locations);
});

app.get("/trip/:id", (req, res) => {
    const id = req.params.id;
    const s = ensureSession(id);
    res.json(s.trip);
});

// ✅ Optional reset session
app.get("/reset/:id", (req, res) => {
    const id = req.params.id;
    sessions[id] = {
        locations: [],
        trip: { startedAt: null, startPoint: null, stoppedAt: null, stopPoint: null }
    };
    res.json({ message: `Reset ✅ (${id})` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));