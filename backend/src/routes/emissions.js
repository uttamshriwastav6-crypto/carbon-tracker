import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

router.post('/api/parse-sms', async (req, res) => {
  const { sms } = req.body;
  if (!sms || typeof sms !== 'string') {
    return res.status(400).json({ error: 'Valid sms string required in the JSON body' });
  }

  const text = sms.toLowerCase();

  let response = {
    activity: "unknown",
    category: "unknown",
    kg_co2: 0,
    tip: "No significant footprint detected in this message.",
    confidence: "low"
  };

  const extractNumber = (pattern) => {
    const match = text.match(pattern);
    return match && match[1] ? parseFloat(match[1]) : 0;
  };

  if (text.includes('uber') || text.includes('ola') || text.includes('rapido')) {
    response.activity = "cab ride";
    response.category = "transportation";
    const km = extractNumber(/([\d.]+)\s*km/);
    if (km > 0) {
      response.kg_co2 = km * 0.17;
      response.confidence = "high";
    } else {
      response.confidence = "low";
    }
    response.tip = "Use a carpool option to cut your trip footprint.";
  } 
  else if (text.includes('swiggy')) {
    response.activity = "food delivery";
    response.category = "food";
    response.kg_co2 = 0.44;
    response.confidence = "high";
    response.tip = "Ordering locally reduces transport emissions.";
  }
  else if (text.includes('indigo') || text.includes('airindia') || text.includes('spicejet') || text.includes('goair')) {
    response.activity = "flight booking";
    response.category = "travel";
    const km = extractNumber(/([\d.]+)\s*km/);
    if (km > 0) {
      response.kg_co2 = km * 0.255;
      response.confidence = "high";
    } else {
      response.confidence = "low";
    }
    response.tip = "Consider offsetting flight emissions to remain carbon neutral.";
  }
  else if (text.includes('irctc')) {
    response.activity = "train journey";
    response.category = "travel";
    const km = extractNumber(/([\d.]+)\s*km/);
    if (km > 0) {
      response.kg_co2 = km * 0.012;
      response.confidence = "high";
    } else {
      response.confidence = "low";
    }
    response.tip = "Trains are extremely eco-friendly compared to flying or driving.";
  }
  else if (text.includes('tneb') || text.includes('bescom') || text.includes('bses') || text.includes('msedcl')) {
    response.activity = "electricity bill";
    response.category = "energy";
    const units = extractNumber(/([\d.]+)\s*(?:units?|kwh)/);
    if (units > 0) {
      response.kg_co2 = units * 0.71;
      response.confidence = "high";
    } else {
      response.confidence = "low";
    }
    response.tip = "Switch to LED bulbs and efficient appliances.";
  }
  else if (text.includes('bpcl') || text.includes('indianoil') || text.includes('hp')) {
    response.activity = "petrol fill";
    response.category = "transportation";
    const litres = extractNumber(/([\d.]+)\s*(?:litres?|l|ltrs?)/);
    if (litres > 0) {
      response.kg_co2 = litres * 2.31;
      response.confidence = "high";
    } else {
      response.confidence = "low";
    }
    response.tip = "Regular tire pressure checks ensure optimal fuel efficiency.";
  }
  else if (text.includes('amazon') || text.includes('flipkart')) {
    response.activity = "shopping delivery";
    response.category = "shopping";
    response.kg_co2 = 0.6;
    response.confidence = "high";
    response.tip = "Choose consolidated deliveries when ordering multiple items.";
  }
  else if (text.includes('bigbasket') || text.includes('blinkit')) {
    response.activity = "grocery";
    response.category = "grocery";
    response.kg_co2 = 0.3;
    response.confidence = "high";
    response.tip = "Walk to your local grocery store to cut down emissions entirely.";
  }
  else if (text.includes('zomato')) {
    // Discriminate between Zomato food and grocery delivery
    if (text.includes('grocery') || text.includes('blinkit')) {
      response.activity = "grocery";
      response.category = "grocery";
      response.kg_co2 = 0.3;
    } else {
      response.activity = "food delivery";
      response.category = "food";
      response.kg_co2 = 0.44;
    }
    response.confidence = "high";
    response.tip = "Supporting local vendors reduces distance traveled for your goods.";
  }

  // Ensure consistent float precision (e.g. 2 decimal places max)
  response.kg_co2 = parseFloat(response.kg_co2.toFixed(3));

  const { error } = await supabase.from('emissions').insert({
    activity: response.activity,
    category: response.category,
    kg_co2: response.kg_co2,
    tip: response.tip,
    confidence: response.confidence,
    sms_text: sms
  });

  if (error) {
    console.error('Supabase insert error:', error.message);
  } else {
    console.log('Saved to Supabase successfully!');
  }

  return res.json(response);
});

export default router;
