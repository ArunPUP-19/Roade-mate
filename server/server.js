const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const isGoogleKeyConfigured = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// In-Memory Database
let trips = [
  {
    id: '1',
    driverName: 'Arun Kumar',
    driverRating: 4.9,
    startingLocation: 'Coimbatore, Tamil Nadu, India',
    destination: 'Tiruppur, Tamil Nadu, India',
    date: '2026-08-14',
    time: '08:00',
    seatsAvailable: 3,
    totalSeats: 4,
    estimatedCost: 200,
    vehicle: 'Hyundai i20 (TN 37 AB 1234)'
  },
  {
    id: '2',
    driverName: 'Priya Sharma',
    driverRating: 4.8,
    startingLocation: 'Gandhipuram, Coimbatore',
    destination: 'Tiruppur Bus Stand',
    date: '2026-08-14',
    time: '09:30',
    seatsAvailable: 2,
    totalSeats: 4,
    estimatedCost: 150,
    vehicle: 'Honda City (TN 38 XY 9876)'
  }
];

let requests = [
  {
    id: '101',
    passengerName: 'Suresh V',
    passengerRating: 4.7,
    startingLocation: 'Singanallur, Coimbatore',
    destination: 'Tiruppur',
    date: '2026-08-14',
    preferredTime: '08:30'
  }
];

// Helper function to query OpenStreetMap Nominatim as a fallback
async function fallbackAutocomplete(q, res) {
  try {
    const osmRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { format: 'json', q, limit: 5 },
      headers: { 'User-Agent': 'RouteMate-App' }
    });
    
    const predictions = osmRes.data.map(item => ({
      place_id: item.place_id,
      description: item.display_name
    }));

    return res.json({ predictions });
  } catch (err) {
    console.error('OSM Fallback Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch location suggestions' });
  }
}

// Helper function for reverse geocoding fallback
async function fallbackReverseGeocode(lat, lon, res) {
  try {
    const osmRes = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { format: 'json', lat, lon },
      headers: { 'User-Agent': 'RouteMate-App' }
    });

    const data = osmRes.data;
    if (data && data.display_name) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county;
      const state = data.address.state;
      const formatted_address = city && state ? `${city}, ${state}` : data.display_name;

      return res.json({
        results: [{ formatted_address }]
      });
    }

    return res.json({ results: [] });
  } catch (err) {
    console.error('OSM Reverse Geocode Fallback Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch location from coordinates' });
  }
}

// Places API Routes
app.get('/api/places/autocomplete', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
  if (!isGoogleKeyConfigured) return fallbackAutocomplete(q, res);

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
      params: { input: q, types: '(cities)', key: GOOGLE_MAPS_API_KEY }
    });

    if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'OVER_QUERY_LIMIT') {
      return fallbackAutocomplete(q, res);
    }
    res.json(response.data);
  } catch (error) {
    return fallbackAutocomplete(q, res);
  }
});

app.get('/api/places/reverse', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Latitude and Longitude are required' });
  if (!isGoogleKeyConfigured) return fallbackReverseGeocode(lat, lon, res);

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { latlng: `${lat},${lon}`, key: GOOGLE_MAPS_API_KEY }
    });

    if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'OVER_QUERY_LIMIT') {
      return fallbackReverseGeocode(lat, lon, res);
    }
    res.json(response.data);
  } catch (error) {
    return fallbackReverseGeocode(lat, lon, res);
  }
});

// --- TRIPS API ROUTES ---

// Create a new trip (Offer a Ride)
app.post('/api/trips', (req, res) => {
  const { startingLocation, destination, date, time, seatsAvailable } = req.body;

  if (!startingLocation || !destination || !date || !time) {
    return res.status(400).json({ error: 'Starting location, destination, date, and time are required.' });
  }

  const newTrip = {
    id: String(Date.now()),
    driverName: 'You (Driver)',
    driverRating: 5.0,
    startingLocation,
    destination,
    date,
    time,
    seatsAvailable: Number(seatsAvailable) || 2,
    totalSeats: Number(seatsAvailable) || 2,
    estimatedCost: Math.floor(Math.random() * 150) + 100,
    vehicle: 'Personal Vehicle'
  };

  trips.unshift(newTrip);
  console.log('New trip published:', newTrip);
  res.status(201).json({ message: 'Trip published successfully!', trip: newTrip });
});

// Search & List Trips
app.get('/api/trips', (req, res) => {
  const { from, to, date } = req.query;

  let filtered = trips;

  if (from) {
    filtered = filtered.filter(t => t.startingLocation.toLowerCase().includes(from.toLowerCase()));
  }
  if (to) {
    filtered = filtered.filter(t => t.destination.toLowerCase().includes(to.toLowerCase()));
  }
  if (date) {
    filtered = filtered.filter(t => t.date === date);
  }

  res.json({ trips: filtered });
});

// --- REQUESTS API ROUTES ---

// Create a ride request
app.post('/api/requests', (req, res) => {
  const { startingLocation, destination, date, preferredTime } = req.body;

  if (!startingLocation || !destination || !date) {
    return res.status(400).json({ error: 'Starting location, destination, and date are required.' });
  }

  const newRequest = {
    id: String(Date.now()),
    passengerName: 'You (Requester)',
    passengerRating: 5.0,
    startingLocation,
    destination,
    date,
    preferredTime: preferredTime || 'Flexible'
  };

  requests.unshift(newRequest);
  console.log('New request published:', newRequest);
  res.status(201).json({ message: 'Ride request published successfully!', request: newRequest });
});

// List Ride Requests
app.get('/api/requests', (req, res) => {
  res.json({ requests });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
