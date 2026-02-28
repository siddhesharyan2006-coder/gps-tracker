const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ✅ VERY IMPORTANT - Serve public folder
app.use(express.static(path.join(__dirname, "public")));

let locations = [];

// Home route
app.get("/", (req, res) => {
    res.send("Server is running ✅");
});

// Save location
app.post("/location", (req, res) => {
    const { latitude, longitude, speed, timestamp } = req.body;

    const record = {
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    locations.push(record);

    res.json({ message: "Location saved ✅", saved: record });
});

// Send all saved locations
app.get("/locations", (req, res) => {
    res.json(locations);
});

// Optional reset
app.get("/reset", (req, res) => {
    locations = [];
    res.json({ message: "Trip reset ✅" });
});

// ✅ IMPORTANT FOR RENDER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});