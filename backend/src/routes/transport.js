import express from 'express';

const router = express.Router();

const emissionFactors = {
  stationary: 0,
  walking: 0,
  cycling: 0,
  '2_wheeler': 0.063,
  auto_rickshaw: 0.085,
  car: 0.17,
  bus: 0.039,
  metro: 0.012,
  train: 0.012,
  flight: 0.255
};

const indiaSpecificTips = {
  stationary: "You're saving energy!",
  walking: "Perfect! Walking produces zero emissions and is a wonderful way to experience your local neighborhood.",
  cycling: "Amazing! Cycling is a zero-emission mode of transport and great for your health in crowded city lanes.",
  '2_wheeler': "Two-wheelers are efficient, but regular maintenance and correct tire pressure can improve mileage and reduce emissions.",
  auto_rickshaw: "Consider riding in a shared auto or choosing an electric auto (e-rickshaw) to save on emissions.",
  car: "Consider carpooling or using public transport like the Metro or city buses to significantly reduce your carbon footprint.",
  bus: "Great job taking the bus! Public transport in Indian cities helps reduce traffic congestion and per-capita emissions.",
  metro: "Using the Metro is one of the most sustainable ways to travel in cities like Delhi, Mumbai, or Bengaluru!",
  train: "The Indian Railways is a great eco-friendly choice for long distances. Opt for electrified routes whenever possible.",
  flight: "Flights have a high carbon footprint. For shorter trips (like Delhi-Jaipur), consider taking a Vande Bharat train instead."
};

// 1. POST /api/detect-transport
router.post('/api/detect-transport', (req, res) => {
  const { speed_kmh, lat, lng } = req.body;

  if (typeof speed_kmh !== 'number') {
    return res.status(400).json({ error: 'speed_kmh is required and must be a number' });
  }

  let mode = 'stationary';
  let needs_confirmation = false;
  let notification_message = '';
  let possible_modes = [];
  let emission_factor = 0;

  if (speed_kmh <= 4) {
    mode = 'stationary';
    needs_confirmation = false;
    possible_modes = ['stationary', 'walking'];
    emission_factor = emissionFactors.stationary;
    notification_message = 'You seem to be stationary or walking.';
  } else if (speed_kmh <= 20) {
    mode = 'cycling_or_2wheeler';
    needs_confirmation = true;
    possible_modes = ['cycling', '2_wheeler', 'auto_rickshaw'];
    emission_factor = emissionFactors['2_wheeler']; // base fallback
    notification_message = `You seem to be moving at ${Math.round(speed_kmh)} km/h. Are you on a Cycle or 2-Wheeler?`;
  } else if (speed_kmh <= 60) {
    mode = 'car_or_bus';
    needs_confirmation = true;
    possible_modes = ['car', 'bus', 'auto_rickshaw', '2_wheeler'];
    emission_factor = emissionFactors.car;
    notification_message = `You seem to be moving at ${Math.round(speed_kmh)} km/h. Are you in a Car or Bus?`;
  } else if (speed_kmh <= 120) {
    mode = 'highway_or_train';
    needs_confirmation = true;
    possible_modes = ['car', 'bus', 'metro', 'train'];
    emission_factor = emissionFactors.train;
    notification_message = `You seem to be moving at ${Math.round(speed_kmh)} km/h. Are you on a Highway or in a Train?`;
  } else {
    mode = 'possible_flight';
    needs_confirmation = true;
    possible_modes = ['train', 'flight'];
    emission_factor = emissionFactors.flight;
    notification_message = `You seem to be moving at ${Math.round(speed_kmh)} km/h. Are you taking a Flight?`;
  }

  return res.json({
    mode,
    needs_confirmation,
    notification_message,
    emission_factor,
    possible_modes
  });
});

// 2. POST /api/calculate-trip
router.post('/api/calculate-trip', (req, res) => {
  const { mode, distance_km } = req.body;

  if (!mode || typeof distance_km !== 'number') {
    return res.status(400).json({ error: 'Valid mode and distance_km are required' });
  }

  const factor = emissionFactors[mode];
  if (factor === undefined) {
    return res.status(400).json({ error: 'Unknown transport mode' });
  }

  const kg_co2 = Number((distance_km * factor).toFixed(3));
  const tip = indiaSpecificTips[mode] || "Consider eco-friendly transport options to reduce your carbon footprint.";
  const activity = `Traveled ${distance_km.toFixed(1)} km by ${mode.replace('_', ' ')}`;

  return res.json({
    mode,
    distance_km,
    kg_co2,
    activity,
    tip
  });
});

export default router;
