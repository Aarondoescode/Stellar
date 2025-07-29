document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("travelForm");
  const results = document.getElementById("results");

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const locationInput = document.getElementById("location").value.trim();
    if (!locationInput) return;

    // Show loading message
    results.innerHTML = `<p class="center-align">Searching for travel spots near "${locationInput}"...</p>`;

    try {
      const apiKey = "d58409f7d83d46b4900418b06f019386"; // Replace this with your actual Geoapify key
      const { lat, lon, name } = await getCoordinates(locationInput, apiKey);
      const attractions = await getTouristAttractions(lat, lon, apiKey);
      displayAttractions(name, lat, lon, attractions);
    } catch (err) {
      console.error(err);
      results.innerHTML = `<p class="red-text center-align">Something went wrong. Try again.</p>`;
    }
  });
});

/**
 * Fetch geolocation coordinates for a given place using Geoapify
 */
async function getCoordinates(location, apiKey) {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error("Location not found");
  }

  const feature = data.features[0];
  return {
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
    name: feature.properties.city || feature.properties.formatted
  };
}

/**
 * Fetch nearby attractions within a 15km radius
 */
async function getTouristAttractions(lat, lon, apiKey) {
  const categories = "tourism,tourism.information,tourism.attraction,tourism.sights";
  const radius = 15000; // in meters
  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=20&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  return data.features.map((place) => {
    const placeLat = place.geometry.coordinates[1];
    const placeLon = place.geometry.coordinates[0];
    const distance = calculateDistance(lat, lon, placeLat, placeLon); // in km

    return {
      name: place.properties.name || "Unnamed Attraction",
      type: place.properties.categories?.[1] || place.properties.categories?.[0] || "Tourist Spot",
      address: place.properties.formatted,
      distance: distance.toFixed(2),
      website: place.properties.website || null
    };
  });
}

/**
 * Haversine formula to calculate distance between two points in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Render results using Materialize card components
 */
function displayAttractions(locationName, userLat, userLon, places) {
  const results = document.getElementById("results");

  if (places.length === 0) {
    results.innerHTML = `<p class="grey-text center-align">No tourist spots found near "${locationName}".</p>`;
    return;
  }

  results.innerHTML = `
    <div class="col s12">
      <h5>Top tourist attractions near <strong>${locationName}</strong>:</h5>
      <div class="row">
        ${places.map((place) => `
          <div class="col s12 m6 l4">
            <div class="card">
              <div class="card-content">
                <span class="card-title">${place.name}</span>
                <p><strong>Address:</strong> ${place.address}</p>
                <p><strong>Distance:</strong> ${place.distance} km</p>
                ${place.website ? `<p><a href="${place.website}" target="_blank">Website</a></p>` : ""}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
