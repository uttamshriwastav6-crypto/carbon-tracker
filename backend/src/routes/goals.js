import express from 'express';

const router = express.Router();

const WEEKLY_BUDGET = 70;

// POST /api/goals/status
router.post('/api/goals/status', (req, res) => {
  const { total_kg_this_week } = req.body;

  if (typeof total_kg_this_week !== 'number') {
    return res.status(400).json({ error: 'total_kg_this_week is required and must be a number' });
  }

  const budget_remaining = Math.max(0, WEEKLY_BUDGET - total_kg_this_week);
  const percentage_used = Math.min(100, (total_kg_this_week / WEEKLY_BUDGET) * 100);

  let escalation_level = 'on_track';
  let agent_message = '';

  if (total_kg_this_week < 49) {
    escalation_level = 'on_track';
    agent_message = 'Great job! You are well within your weekly carbon budget. Keep it up!';
  } else if (total_kg_this_week <= 63) {
    escalation_level = 'warning';
    agent_message = 'Heads up! You are approaching your weekly carbon limit. Try skipping one delivery order today.';
  } else {
    escalation_level = 'critical';
    agent_message = 'Carbon budget critical! You have used over 90% of your weekly limit. Consider walking or taking metro for the next few days.';
  }

  return res.json({
    total_kg_this_week,
    budget_remaining: Number(budget_remaining.toFixed(2)),
    percentage_used: Number(percentage_used.toFixed(2)),
    escalation_level,
    agent_message
  });
});

export default router;
