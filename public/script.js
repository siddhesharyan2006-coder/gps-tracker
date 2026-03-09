async function loadVehicles() {
  try {
    const response = await fetch("/api/vehicles");
    const vehicles = await response.json();

    const vehicleList = document.getElementById("vehicle-list");
    vehicleList.innerHTML = "";

    vehicles.forEach((vehicle) => {
      const div = document.createElement("div");
      div.className = "vehicle-item";

      div.innerHTML = `
        <h3>${vehicle.vehicle}</h3>
        <p><strong>Driver:</strong> ${vehicle.driver}</p>
        <p><strong>Latitude:</strong> ${vehicle.latitude}</p>
        <p><strong>Longitude:</strong> ${vehicle.longitude}</p>
        <p><strong>Speed:</strong> ${vehicle.speed}</p>
        <p><strong>Status:</strong> 
          <span class="${vehicle.status === "Moving" ? "status-moving" : "status-idle"}">
            ${vehicle.status}
          </span>
        </p>
      `;

      vehicleList.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading vehicles:", error);
  }
}

loadVehicles();