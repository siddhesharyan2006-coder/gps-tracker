const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let locations = [];
let trip = { startedAt: null, startPoint: null, stoppedAt: null, stopPoint: null };

app.get("/", (req, res) => res.send("Server is running ✅"));

app.post("/location", (req, res) => {
    const { latitude, longitude, speed, timestamp } = req.body;

    // ignore if no valid coords
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ message: "Invalid coordinates" });
    }

    // if stopped, ignore extra points
    if (trip.stoppedAt) return res.json({ message: "Trip already stopped. Ignoring." });

    const record = {
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    // set start point from first point after START
    if (trip.startedAt && !trip.startPoint) {
        trip.startPoint = { latitude: record.latitude, longitude: record.longitude };
    }

    locations.push(record);
    res.json({ message: "Location saved ✅" });
});

app.post("/event", (req, res) => {
    const { type, timestamp } = req.body;
    const time = timestamp || new Date().toISOString();

    if (type === "START") {
        locations = [];
        trip = { startedAt: time, startPoint: null, stoppedAt: null, stopPoint: null };
        return res.json({ message: "Trip started ✅", trip });
    }

    if (type === "STOP") {
        trip.stoppedAt = time;
        const last = locations[locations.length - 1];
        if (last) trip.stopPoint = { latitude: last.latitude, longitude: last.longitude };
        return res.json({ message: "Trip stopped ✅", trip });
    }

    res.status(400).json({ message: "Invalid event type" });
});

app.get("/locations", (req, res) => res.json(locations));
app.get("/trip", (req, res) => res.json(trip));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));