import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; // Import Leaflet for custom icon
import geoJsonData from "./ukRegions.json"; // Import your GeoJSON file
import { cities } from "./cities"; // Import the cities data

const regionColors = {
  England: "#99ccff", // Light blue
  Scotland: "#ff9999", // Light red
  Wales: "#99ff99", // Light green
  "Northern Ireland": "#ffcc99", // Light orange
};

// Style function to apply different colors to different regions based on the region name
const geoJsonStyle = (feature) => {
  const regionName = feature.properties.CTRY24NM; // Extract country name
  const fillColor = regionColors[regionName] || "#cccccc"; // Default grey if not found
  return {
    fillColor: fillColor,
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 1,
  };
};

// Haversine Formula to calculate distance (km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Exponential Decay Scoring Function
const exponentialDecayScore = (
  distance,
  threshold = 10,
  maxScore = 500,
  decayRate = 0.035
) => {
  if (distance <= threshold) {
    return maxScore; // No decay for distances within the threshold (e.g., 10 miles)
  }

  const distanceBeyondThreshold = distance - threshold;
  const score = Math.round(
    maxScore * Math.exp(-decayRate * distanceBeyondThreshold)
  );
  return Math.max(0, score); // Ensure score doesn't go below 0
};

// Map Click Component
const ClickHandler = ({ onClick, lockedIn }) => {
  useMapEvents({
    click: (e) => {
      if (!lockedIn) {
        // Only allow map clicks if the guess is not locked
        onClick(e.latlng);
      }
    },
  });
  return null;
};

const customIcon = new L.Icon({
  iconUrl:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Map_pin_icon.svg/1280px-Map_pin_icon.svg.png", // You can use an image URL for a pin
  iconSize: [16, 24], // Size of the pin
  iconAnchor: [8, 24], // Anchor the marker at the bottom center (where it points)
  popupAnchor: [0, -24], // Adjust popup position
});

const targetIcon = new L.Icon({
  iconUrl:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Map_pin_icon_green.svg/1280px-Map_pin_icon_green.svg.png", // You can use an image URL for a pin
  iconSize: [16, 24], // Size of the pin
  iconAnchor: [8, 24], // Anchor the marker at the bottom center (where it points)
  popupAnchor: [0, -24], // Adjust popup position
});

export default function UKMapGame() {
  const [targetCity, setTargetCity] = useState(
    cities[Math.floor(Math.random() * cities.length)]
  );
  const [guess, setGuess] = useState(null);
  const [score, setScore] = useState(0); // Set default to 0
  const [lockedIn, setLockedIn] = useState(false); // Track if the guess is locked in
  const [totalScore, setTotalScore] = useState(0); // To store the running total score
  const [roundsPlayed, setRoundsPlayed] = useState(0); // To track how many rounds have been played
  const [gameOver, setGameOver] = useState(false); // To track when 10 rounds are completed
  const [rounds, setRounds] = useState(
    Array(10).fill({ city: "", distance: "", score: "" })
  ); // Initialize empty rows

  const handleMapClick = (latlng) => {
    if (!lockedIn) {
      setGuess(latlng); // Update guess
    }
  };

  const resetGame = () => {
    setRounds(Array(10).fill({ city: "", distance: "", score: "" }));
    setRoundsPlayed(0);
    setTotalScore(0);
    setGameOver(false);
    setLockedIn(false);
    setGuess(null);
    setScore(0);
    setTargetCity(cities[Math.floor(Math.random() * cities.length)]);
  };

  const lockInGuess = () => {
    const distance = haversineDistance(
      guess.lat,
      guess.lng,
      targetCity.lat,
      targetCity.lon
    );
    const points = exponentialDecayScore(distance);

    setScore(points); // Set the score for this round
    setTotalScore((prevTotal) => prevTotal + points); // Add the score to the running total
    setLockedIn(true); // Lock the guess in
    setRoundsPlayed((prevRounds) => prevRounds + 1); // Increment rounds played

    const newRound = {
      city: targetCity.name,
      distance: distance.toFixed(0),
      score: points,
    };

    // Shift the rounds to make space for the new round (replace the first row)
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds.pop(); // Remove the last entry
      newRounds.unshift(newRound); // Add the new round to the top
      return newRounds;
    });

    if (roundsPlayed + 1 >= 10) {
      setGameOver(true); // End the game after 10 rounds
    }
  };

  const handleNewCity = () => {
    if (gameOver) {
      resetGame(); // Reset the game if the player has finished 10 rounds
    } else {
      setTargetCity(cities[Math.floor(Math.random() * cities.length)]);
      setLockedIn(false); // Reset locked-in state when a new city is chosen
      setGuess(null); // Reset the guess
      setScore(0); // Reset the score
    }
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "40px" }}
    >
      {/* Left side: Text and table */}
      <div style={{ flex: 2 }}>
        <h2>Guess the location: {targetCity.name}</h2>
        <h3>
          Score: {totalScore} / {500 * roundsPlayed}
        </h3>{" "}
        {/* Display score outside the popup */}
        <h3>Rounds Played: {roundsPlayed} / 10</h3>
        {gameOver && <h3>Game Over! Final Score: {totalScore}</h3>}
        {/* Table for rounds */}
        <table border="1" style={{ width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px" }}>City</th>
              <th style={{ padding: "8px" }}>Distance (km)</th>
              <th style={{ padding: "8px" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, index) => (
              <tr key={index}>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {round.city || "-"}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {round.distance || "-"}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {round.score || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Buttons */}
        <button onClick={lockInGuess} disabled={lockedIn || !guess}>
          Lock In Guess
        </button>
        <button onClick={handleNewCity} disabled={!lockedIn || gameOver}>
          New City
        </button>
        <button onClick={resetGame}>Reset Game</button>
      </div>

      {/* Right side: Map */}
      <div style={{ flex: 3 }}>
        <MapContainer
          center={[54.5, -3]}
          zoom={6}
          style={{ height: "700px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
          <GeoJSON data={geoJsonData} style={geoJsonStyle} />
          <ClickHandler onClick={handleMapClick} lockedIn={lockedIn} />{" "}
          {/* Pass lockedIn here */}
          {/* Display target city marker when locked in */}
          {lockedIn && (
            <Marker
              position={[targetCity.lat, targetCity.lon]}
              icon={targetIcon}
            ></Marker>
          )}
          {/* Display guessed marker */}
          {guess && (
            <Marker position={[guess.lat, guess.lng]} icon={customIcon}>
              {lockedIn && (
                <Popup>
                  Distance:{" "}
                  {haversineDistance(
                    guess.lat,
                    guess.lng,
                    targetCity.lat,
                    targetCity.lon
                  ).toFixed(0)}{" "}
                  km
                  <br />
                  Score: {score} points!
                </Popup>
              )}
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
