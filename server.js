const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const vehicleData = [
  {
    id: 1,
    vehicle: "Bus A1",
    driver: "Ramesh",
    latitude: 17.7285,
    longitude: 83.3162,
    status: "Moving",
    speed: "42 km/h"
  },
  {
    id: 2,
    vehicle: "Van B2",
    driver: "Suresh",
    latitude: 17.7321,
    longitude: 83.3018,
    status: "Idle",
    speed: "0 km/h"
  },
  {
    id: 3,
    vehicle: "Truck C3",
    driver: "Mahesh",
    latitude: 17.7199,
    longitude: 83.3251,
    status: "Moving",
    speed: "36 km/h"
  }
];

app.get("/api/vehicles", (req, res) => {
  res.json(vehicleData);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});