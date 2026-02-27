const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let locations = [];

// TEST ROUTE (this fixes Cannot GET /)
app.get("/", (req, res) => {
    res.send("Server is running ✅");
});

// Save location
app.post("/location", (req, res) => {
    const data = req.body;
    locations.push(data);
    res.json({ message: "Location saved" });
});

// Get all locations
app.get("/locations", (req, res) => {
    res.json(locations);
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
