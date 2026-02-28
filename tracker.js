const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ MUST be here (serves /tracker.html, /viewer.html, /tracker.js)
app.use(express.static(path.join(__dirname, "public")));

let locations = [];

app.get("/", (req, res) => res.send("Server is running ✅"));

app.post("/location", (req, res) => {
    const { latitude, longitude, speed, timestamp } = req.body;

    locations.push({
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: timestamp || new Date().toISOString()
    });

    res.json({ message: "Location saved ✅" });
});

app.get("/locations", (req, res) => res.json(locations));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Running on port", PORT));