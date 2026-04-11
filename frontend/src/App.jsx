import React, { useState } from 'react';

export default function App() {
  // ── SMS Analyser state ──
  const [sms, setSms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [smsError, setSmsError] = useState('');

  // ── Transport Detector state ──
  const [speed, setSpeed] = useState('');
  const [transportResult, setTransportResult] = useState(null);
  const [tripMode, setTripMode] = useState('');
  const [distance, setDistance] = useState('');
  const [tripResult, setTripResult] = useState(null);
  const [transportLoading, setTransportLoading] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);

  // ── Activities & UI state ──
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('sms');
  const [activeNav, setActiveNav] = useState('home');

  // ── Helpers ──
  const co2Color = (kg) => {
    if (kg < 1) return '#00ff88';
    if (kg <= 5) return '#ff9500';
    return '#ff3b30';
  };

  const impactLabel = (kg) => {
    if (kg < 1) return 'Low Impact';
    if (kg <= 5) return 'Moderate';
    return 'High Impact';
  };

  const impactIcon = (kg) => {
    if (kg < 1) return '🌿';
    if (kg <= 5) return '⚠️';
    return '🔥';
  };

  // ── API: Parse SMS ──
  const handleAnalyseSMS = async () => {
    if (!sms.trim()) return;
    setLoading(true);
    setSmsError('');
    setResult(null);
    try {
      const response = await fetch('https://carbon-trackers.onrender.com/api/parse-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setResult(data);
      setActivities(prev => [{ id: Date.now(), ...data }, ...prev]);
    } catch (err) {
      setSmsError('Failed to analyse SMS. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── API: Detect Transport ──
  const handleDetectTransport = async () => {
    if (!speed) return;
    setTransportLoading(true);
    setTransportResult(null);
    setTripMode('');
    setTripResult(null);
    try {
      const response = await fetch('https://carbon-trackers.onrender.com/api/detect-transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_kmh: parseFloat(speed) })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setTransportResult(data);
      if (!data.needs_confirmation && data.mode) {
        setTripMode(data.mode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransportLoading(false);
    }
  };

  // ── API: Calculate Trip ──
  const handleLogTrip = async () => {
    if (!tripMode || !distance) return;
    setTripLoading(true);
    try {
      const response = await fetch('https://carbon-trackers.onrender.com/api/calculate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: tripMode, distance_km: parseFloat(distance) })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setTripResult(data);
      setActivities(prev => [{
        id: Date.now(),
        activity: data.activity,
        category: 'transportation',
        kg_co2: data.kg_co2,
        tip: data.tip,
        confidence: 'high'
      }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setTripLoading(false);
    }
  };

  // ── Computed values ──
  const totalKg = activities.reduce((sum, a) => sum + (a.kg_co2 || 0), 0);
  const weeklyBudget = 70;
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const pastData = [2.1, 3.4, 1.8, 5.2, 2.9, 4.1, 0];
  pastData[todayIndex] = totalKg;
  const maxBar = Math.max(...pastData, 10);
  const weeklyUsage = pastData.reduce((a, b) => a + b, 0);
  const percentUsed = Math.min(100, Math.round((weeklyUsage / weeklyBudget) * 100));
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const offset = circleCircumference - (percentUsed / 100) * circleCircumference;
  const getDayLabel = (idx) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx];
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Eco tips data (from Stitch Eco Tips screen) ──
  const ecoTips = [
    {
      icon: '🚗',
      title: 'Carpool More',
      desc: 'Share rides with colleagues or friends to reduce the number of vehicles on the road. Halve your emissions and fuel costs with a single shared journey.',
      savings: '~50% less emissions'
    },
    {
      icon: '🚌',
      title: 'Use Public Transport',
      desc: 'Buses and trains are the most efficient ways to travel through urban areas. Opting for transit over a solo drive can cut your footprint by up to 70%.',
      savings: '~70% reduction'
    },
    {
      icon: '🚴',
      title: 'Walk or Bike',
      desc: 'The ultimate zero-emission commute. Walking or cycling for short trips not only saves the planet but improves your cardiovascular health.',
      savings: 'Zero emissions',
      badges: ['Zero carbon emissions', 'Improved personal fitness']
    }
  ];

  // ── Vehicle types from Stitch Select Vehicle screen ──
  const vehicleTypes = [
    { icon: '🚗', label: 'Car', sub: 'Petrol / Diesel', value: 'car' },
    { icon: '🏍️', label: 'Motorcycle', sub: 'Motorbike / Scooter', value: 'motorcycle' },
    { icon: '🚲', label: 'Bicycle', sub: 'Eco-Friendly', value: 'bicycle' },
    { icon: '🚌', label: 'Public', sub: 'Bus / Train', value: 'public_transport' },
  ];

  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {
          --bg: #0a0a0a;
          --bg2: #111111;
          --bg3: #161616;
          --bg4: #1c1c1c;
          --border: rgba(255,255,255,0.06);
          --border-accent: rgba(0,255,136,0.2);
          --accent: #00ff88;
          --accent-dim: rgba(0,255,136,0.08);
          --accent-mid: rgba(0,255,136,0.15);
          --orange: #ff9500;
          --red: #ff3b30;
          --text: #e8e8e8;
          --text-secondary: #888888;
          --text-muted: #555555;
          --text-dim: #333333;
          --sans: 'Space Grotesk', -apple-system, sans-serif;
          --mono: 'JetBrains Mono', 'Fira Code', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::selection {
          background: rgba(0,255,136,0.25);
          color: #fff;
        }

        .app-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 20px 24px 100px;
        }

        /* ═══════════════════════════════════════════
           HEADER — inspired by Stitch EcoTrack header
           ═══════════════════════════════════════════ */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0 20px;
          margin-bottom: 8px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #154212, #2D5A27);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          box-shadow: 0 4px 24px rgba(0,255,136,0.12);
          position: relative;
          overflow: hidden;
        }

        .brand-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(0,255,136,0.15));
          border-radius: inherit;
        }

        .brand-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .brand-accent { color: var(--accent); }

        .brand-subtitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-muted);
          margin-top: 3px;
          font-weight: 500;
        }

        .header-meta {
          text-align: right;
        }

        .header-date {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--accent);
          background: var(--accent-dim);
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid var(--border-accent);
          font-weight: 500;
          letter-spacing: 1px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        /* ═══════════════════════════════════════════
           HERO STATS — from Stitch Dashboard screen
           ═══════════════════════════════════════════ */
        .hero-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: var(--bg2);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
        }

        .stat-card-featured {
          background: linear-gradient(160deg, var(--bg2), rgba(0,255,136,0.04));
          border: 1px solid var(--border-accent);
        }

        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 12px;
        }

        .stat-value {
          font-family: var(--mono);
          font-size: 40px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -2px;
        }

        .stat-unit {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 400;
          margin-left: 4px;
          letter-spacing: 0;
        }

        .stat-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 8px;
        }

        /* ═══════════════════════════════════════════
           TAB PANEL — the main input area
           ═══════════════════════════════════════════ */
        .panel {
          background: var(--bg2);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
        }

        .panel-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 16px;
        }

        .tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          background: var(--bg3);
          border-radius: 14px;
          padding: 4px;
        }

        .tab {
          flex: 1;
          padding: 10px 16px;
          border-radius: 11px;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .tab:hover { color: var(--text-secondary); }

        .tab.active {
          background: var(--accent);
          color: #0a0a0a;
          box-shadow: 0 2px 12px rgba(0,255,136,0.25);
        }

        .input-field {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 14px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 13px;
          width: 100%;
          padding: 14px 16px;
          resize: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          line-height: 1.6;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--border-accent);
          box-shadow: 0 0 0 3px rgba(0,255,136,0.06);
        }

        .input-field::placeholder {
          color: var(--text-dim);
        }

        textarea.input-field { min-height: 110px; }
        input.input-field { height: 48px; }

        .field-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .btn-primary {
          width: 100%;
          margin-top: 14px;
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0a0a0a;
          font-weight: 700;
          font-family: var(--sans);
          font-size: 14px;
          border-radius: 14px;
          padding: 14px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(0,255,136,0.2);
          letter-spacing: 0.3px;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(0,255,136,0.35);
          transform: translateY(-1px);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(10,10,10,0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .error-msg {
          background: rgba(255,59,48,0.08);
          color: var(--red);
          border: 1px solid rgba(255,59,48,0.2);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-msg {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--border-accent);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-top: 14px;
          line-height: 1.5;
        }

        /* ═══════════════════════════════════════════
           RESULT CARD — emission result display
           ═══════════════════════════════════════════ */
        .result-card {
          background: var(--bg3);
          border-radius: 16px;
          padding: 20px;
          margin-top: 16px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .result-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }

        .result-card-green::before { background: var(--accent); }
        .result-card-orange::before { background: var(--orange); }
        .result-card-red::before { background: var(--red); }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .result-activity {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .result-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-green {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--border-accent);
        }

        .badge-orange {
          background: rgba(255,149,0,0.08);
          color: var(--orange);
          border: 1px solid rgba(255,149,0,0.2);
        }

        .badge-red {
          background: rgba(255,59,48,0.08);
          color: var(--red);
          border: 1px solid rgba(255,59,48,0.2);
        }

        .badge-muted {
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .co2-value {
          font-family: var(--mono);
          font-size: 36px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -1px;
        }

        .co2-unit {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .tip-box {
          background: rgba(0,255,136,0.04);
          border: 1px solid rgba(0,255,136,0.12);
          border-radius: 12px;
          padding: 14px 16px;
          margin-top: 14px;
          font-size: 13px;
          color: #88ddaa;
          line-height: 1.6;
          display: flex;
          gap: 10px;
        }

        .tip-box-icon {
          flex-shrink: 0;
          font-size: 16px;
          margin-top: 1px;
        }

        /* ═══════════════════════════════════════════
           VEHICLE SELECT — from Stitch Select Vehicle
           ═══════════════════════════════════════════ */
        .vehicle-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .vehicle-card {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 16px;
          cursor: pointer;
          transition: all 0.25s;
          text-align: center;
        }

        .vehicle-card:hover {
          border-color: var(--text-dim);
          background: var(--bg4);
        }

        .vehicle-card.selected {
          border-color: var(--accent);
          background: var(--accent-dim);
          box-shadow: 0 0 20px rgba(0,255,136,0.08);
        }

        .vehicle-icon { font-size: 28px; margin-bottom: 8px; }

        .vehicle-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .vehicle-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* ═══════════════════════════════════════════
           GRID LAYOUT — main content grid
           ═══════════════════════════════════════════ */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 680px) {
          .main-grid { grid-template-columns: 1fr 1fr; }
          .main-grid .span-2 { grid-column: 1 / -1; }
        }

        .card {
          background: var(--bg2);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
        }

        .card-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 18px;
        }

        /* ═══════════════════════════════════════════
           TODAY'S FOOTPRINT — main CO2 display
           ═══════════════════════════════════════════ */
        .total-display {
          margin-bottom: 24px;
        }

        .total-value {
          font-family: var(--mono);
          font-size: 56px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -3px;
        }

        .total-limit {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .progress-track {
          height: 8px;
          background: var(--bg3);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        /* ═══════════════════════════════════════════
           ACTIVITIES LIST — logged emissions
           ═══════════════════════════════════════════ */
        .activities-empty {
          border: 1px dashed var(--border);
          border-radius: 14px;
          padding: 28px 20px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .activity-row {
          background: var(--bg3);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          transition: background 0.2s;
        }

        .activity-row:hover { background: var(--bg4); }

        .act-name {
          font-size: 13px;
          font-weight: 600;
        }

        .act-cat {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          text-transform: capitalize;
        }

        .act-kg {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 600;
        }

        /* ═══════════════════════════════════════════
           WEEKLY BUDGET — ring chart & bar chart
           ═══════════════════════════════════════════ */
        .stats-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 28px;
        }

        .ring-chart {
          width: 120px;
          height: 120px;
          position: relative;
          flex-shrink: 0;
        }

        .ring-svg {
          transform: rotate(-90deg);
        }

        .ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ring-pct {
          font-family: var(--mono);
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
        }

        .ring-lbl {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .budget-info h3 {
          font-family: var(--mono);
          font-size: 28px;
          font-weight: 500;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .budget-info p {
          font-size: 12px;
          color: var(--text-muted);
          margin: 4px 0 8px;
        }

        .budget-info .motivational {
          font-size: 13px;
          color: var(--text);
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 100px;
          margin-bottom: 8px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }

        .bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          gap: 8px;
        }

        .bar {
          width: 100%;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          min-height: 4px;
        }

        .bar-today {
          background: var(--accent) !important;
          box-shadow: 0 0 16px rgba(0,255,136,0.25);
        }

        .bar-today-orange {
          background: var(--orange) !important;
          box-shadow: 0 0 16px rgba(255,149,0,0.2);
        }

        .bar-today-red {
          background: var(--red) !important;
          box-shadow: 0 0 16px rgba(255,59,48,0.2);
        }

        .day-lbl {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
        }

        .day-lbl-today {
          color: var(--text);
          font-weight: 700;
        }

        /* ═══════════════════════════════════════════
           ECO TIPS — from Stitch Eco Tips screen
           ═══════════════════════════════════════════ */
        .eco-tip-card {
          background: var(--bg3);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 12px;
          transition: all 0.25s;
        }

        .eco-tip-card:hover {
          background: var(--bg4);
          transform: translateX(4px);
        }

        .eco-tip-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 10px;
        }

        .eco-tip-icon {
          width: 44px;
          height: 44px;
          background: var(--accent-dim);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .eco-tip-title {
          font-size: 16px;
          font-weight: 700;
        }

        .eco-tip-savings {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--accent);
          margin-top: 2px;
        }

        .eco-tip-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .eco-tip-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .eco-tip-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--accent);
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          padding: 6px 12px;
          border-radius: 99px;
        }

        /* ═══════════════════════════════════════════
           BOTTOM NAV — from Stitch screens
           ═══════════════════════════════════════════ */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(10,10,10,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: center;
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
          z-index: 100;
        }

        .nav-inner {
          display: flex;
          gap: 0;
          max-width: 400px;
          width: 100%;
        }

        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 0;
          cursor: pointer;
          background: none;
          border: none;
          color: var(--text-dim);
          font-size: 10px;
          font-family: var(--sans);
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item:hover { color: var(--text-muted); }

        .nav-item.active {
          color: var(--accent);
        }

        .nav-icon { font-size: 20px; }

        /* ═══════════════════════════════════════════
           EMISSION BREAKDOWN — from Stitch Dashboard
           ═══════════════════════════════════════════ */
        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }

        .breakdown-item:last-child { border-bottom: none; }

        .breakdown-icon {
          width: 40px;
          height: 40px;
          background: var(--bg3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .breakdown-info { flex: 1; }

        .breakdown-name {
          font-size: 14px;
          font-weight: 600;
        }

        .breakdown-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .breakdown-value {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }

        .breakdown-unit {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* ═══════════════════════════════════════════
           ANIMATIONS
           ═══════════════════════════════════════════ */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ═══════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════ */
        @media (max-width: 680px) {
          .app-container { padding: 16px 16px 100px; }
          .header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .header-meta { text-align: left; }
          .hero-stats { grid-template-columns: 1fr; }
          .stat-value { font-size: 32px; }
          .total-value { font-size: 44px; }
          .stats-header { flex-direction: column; align-items: flex-start; }
          .vehicle-grid { grid-template-columns: 1fr 1fr; }
          .co2-value { font-size: 28px; }
        }

        @media (max-width: 400px) {
          .vehicle-grid { grid-template-columns: 1fr; }
          .tabs { flex-direction: column; }
        }
      `}</style>

      <div className="app-container">

        {/* ══════════ HEADER ══════════ */}
        <header className="header">
          <div className="header-brand">
            <div className="brand-icon">🌍</div>
            <div>
              <div className="brand-title">
                Eco<span className="brand-accent">Track</span>
              </div>
              <div className="brand-subtitle">Carbon Footprint Tracker</div>
            </div>
          </div>
          <div className="header-meta">
            <div className="header-date">{todayStr}</div>
            <div className="live-badge">
              <div className="pulse-dot"></div>
              TRACKING LIVE
            </div>
          </div>
        </header>

        {/* ══════════ HERO STATS — from Stitch Dashboard ══════════ */}
        <div className="hero-stats">
          <div className="stat-card stat-card-featured">
            <div className="stat-label">Today's Emissions</div>
            <div className="stat-value" style={{ color: co2Color(totalKg) }}>
              {totalKg.toFixed(1)}
              <span className="stat-unit">kg CO₂</span>
            </div>
            <div className="stat-sub">
              {totalKg < 5 ? '🌿 Below daily average' : totalKg < 10 ? '⚡ Near daily budget' : '🔥 Over daily budget'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Week</div>
            <div className="stat-value" style={{ color: weeklyUsage < 50 ? '#00ff88' : weeklyUsage < 70 ? '#ff9500' : '#ff3b30' }}>
              {weeklyUsage.toFixed(1)}
              <span className="stat-unit">kg CO₂</span>
            </div>
            <div className="stat-sub">
              {Math.max(0, weeklyBudget - weeklyUsage).toFixed(1)} kg remaining of {weeklyBudget} kg budget
            </div>
          </div>
        </div>

        {/* ══════════ INPUT PANEL ══════════ */}
        <div className="panel">
          <div className="panel-title">Carbon Tracker</div>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'sms' ? 'active' : ''}`}
              onClick={() => setActiveTab('sms')}
            >
              📱 SMS Analyser
            </button>
            <button
              className={`tab ${activeTab === 'transport' ? 'active' : ''}`}
              onClick={() => setActiveTab('transport')}
            >
              🚗 Trip Logger
            </button>
          </div>

          {activeTab === 'sms' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="field-label">Paste any transaction SMS</div>
              <textarea
                className="input-field"
                value={sms}
                onChange={e => setSms(e.target.value)}
                placeholder={"Paste any Indian SMS here...\n\nExamples:\n• Your Ola ride of 12.5 km is complete. Fare ₹185\n• BPCL: 10 litres dispensed at pump #3\n• Your Swiggy order has been delivered!"}
              />
              <button
                className="btn-primary"
                onClick={handleAnalyseSMS}
                disabled={loading || !sms.trim()}
              >
                {loading ? <><div className="spinner"></div> Analysing…</> : '⚡ Analyse SMS'}
              </button>

              {smsError && <div className="error-msg">⚠️ {smsError}</div>}

              {result && (
                <div className={`result-card ${result.kg_co2 < 1 ? 'result-card-green' : result.kg_co2 <= 5 ? 'result-card-orange' : 'result-card-red'}`}>
                  <div className="result-header">
                    <div>
                      <div className="result-activity">{result.activity || 'Activity'}</div>
                      <div className="result-badges">
                        <span className={`badge ${result.kg_co2 < 1 ? 'badge-green' : result.kg_co2 <= 5 ? 'badge-orange' : 'badge-red'}`}>
                          {impactIcon(result.kg_co2)} {impactLabel(result.kg_co2)}
                        </span>
                        <span className="badge badge-muted">{result.category}</span>
                        <span className={`badge ${result.confidence === 'high' ? 'badge-green' : 'badge-muted'}`}>
                          {result.confidence} conf
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="co2-value" style={{ color: co2Color(result.kg_co2) }}>
                        {result.kg_co2}
                      </span>
                      <div className="co2-unit">kg CO₂</div>
                    </div>
                  </div>
                  {result.tip && (
                    <div className="tip-box">
                      <span className="tip-box-icon">💡</span>
                      <span>{result.tip}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Step 1: Speed detection */}
              <div className="field-label">Current Speed (km/h)</div>
              <input
                className="input-field"
                type="number"
                value={speed}
                onChange={e => setSpeed(e.target.value)}
                placeholder="e.g. 45"
              />
              <button
                className="btn-primary"
                onClick={handleDetectTransport}
                disabled={!speed || transportLoading}
              >
                {transportLoading ? <><div className="spinner"></div> Detecting…</> : '🔍 Detect Transport Mode'}
              </button>

              {transportResult && (
                <div style={{ marginTop: '16px', animation: 'slideUp 0.3s ease' }}>
                  <div className="info-msg">{transportResult.notification_message}</div>

                  {/* Vehicle Selection — from Stitch Select Vehicle screen */}
                  {transportResult.needs_confirmation && transportResult.possible_modes && (
                    <div>
                      <div className="field-label" style={{ marginTop: '16px' }}>Select your vehicle</div>
                      <div className="vehicle-grid">
                        {transportResult.possible_modes.map(m => {
                          const match = vehicleTypes.find(v => v.value === m) || {
                            icon: '🚗',
                            label: m.replace(/_/g, ' '),
                            sub: 'Transport'
                          };
                          return (
                            <div
                              key={m}
                              className={`vehicle-card ${tripMode === m ? 'selected' : ''}`}
                              onClick={() => setTripMode(m)}
                            >
                              <div className="vehicle-icon">{match.icon}</div>
                              <div className="vehicle-label">{match.label}</div>
                              <div className="vehicle-sub">{match.sub}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Auto-detected mode display */}
                  {!transportResult.needs_confirmation && transportResult.mode && (
                    <div style={{ marginTop: '12px' }}>
                      <div className="field-label">Detected Mode</div>
                      <div className="vehicle-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {(() => {
                          const m = transportResult.mode;
                          const match = vehicleTypes.find(v => v.value === m) || {
                            icon: '🚗',
                            label: m.replace(/_/g, ' '),
                            sub: `Emission factor: ${transportResult.emission_factor} kg/km`
                          };
                          return (
                            <div className="vehicle-card selected">
                              <div className="vehicle-icon">{match.icon}</div>
                              <div className="vehicle-label">{match.label}</div>
                              <div className="vehicle-sub">
                                Emission factor: {transportResult.emission_factor} kg/km
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Distance & trip logging */}
              {tripMode && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', animation: 'slideUp 0.3s ease' }}>
                  <div className="field-label">Distance Travelled (km)</div>
                  <input
                    className="input-field"
                    type="number"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    placeholder="e.g. 12.5"
                  />
                  <button
                    className="btn-primary"
                    onClick={handleLogTrip}
                    disabled={!distance || tripLoading}
                  >
                    {tripLoading ? <><div className="spinner"></div> Logging…</> : '📍 Log This Trip'}
                  </button>

                  {tripResult && (
                    <div className={`result-card ${tripResult.kg_co2 < 1 ? 'result-card-green' : tripResult.kg_co2 <= 5 ? 'result-card-orange' : 'result-card-red'}`}>
                      <div className="result-header">
                        <div>
                          <div className="result-activity">{tripResult.activity || 'Trip'}</div>
                          <div className="result-badges">
                            <span className={`badge ${tripResult.kg_co2 < 1 ? 'badge-green' : tripResult.kg_co2 <= 5 ? 'badge-orange' : 'badge-red'}`}>
                              {impactIcon(tripResult.kg_co2)} {impactLabel(tripResult.kg_co2)}
                            </span>
                            <span className="badge badge-muted">transportation</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="co2-value" style={{ color: co2Color(tripResult.kg_co2) }}>
                            {tripResult.kg_co2}
                          </span>
                          <div className="co2-unit">kg CO₂</div>
                        </div>
                      </div>
                      {tripResult.tip && (
                        <div className="tip-box">
                          <span className="tip-box-icon">💡</span>
                          <span>{tripResult.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════ MAIN GRID ══════════ */}
        {activeNav === 'home' && (
          <div className="main-grid" style={{ animation: 'fadeIn 0.4s ease' }}>

            {/* Card: Today's Footprint */}
            <div className="card">
              <div className="card-label">Today's Footprint</div>

              <div className="total-display">
                <span className="total-value" style={{ color: co2Color(totalKg) }}>
                  {totalKg.toFixed(1)}
                </span>
                <span style={{ fontSize: '16px', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--sans)' }}>kg CO₂</span>
                <div className="total-limit">of 10 kg daily limit</div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (totalKg / 10) * 100)}%`,
                      backgroundColor: co2Color(totalKg)
                    }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>0</span>
                  <span>10 kg</span>
                </div>
              </div>

              <div className="card-label">Logged Activities</div>
              {activities.length === 0 ? (
                <div className="activities-empty">
                  🌱 No activities yet.<br/>
                  Paste an SMS or log a trip above to start tracking.
                </div>
              ) : (
                <div>
                  {activities.map(act => (
                    <div key={act.id} className="activity-row">
                      <div>
                        <div className="act-name">{act.activity}</div>
                        <div className="act-cat">{act.category}</div>
                      </div>
                      <div className="act-kg" style={{ color: co2Color(act.kg_co2) }}>
                        {act.kg_co2} kg
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card: Weekly Budget & Chart */}
            <div className="card">
              <div className="card-label">Weekly Budget</div>

              <div className="stats-header">
                <div className="ring-chart">
                  <svg width="120" height="120" className="ring-svg">
                    <circle
                      cx="60" cy="60" r={circleRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60" cy="60" r={circleRadius}
                      fill="none"
                      stroke={percentUsed > 100 ? '#ff3b30' : percentUsed > 70 ? '#ff9500' : '#00ff88'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease' }}
                    />
                  </svg>
                  <div className="ring-center">
                    <div className="ring-pct">{percentUsed}%</div>
                    <div className="ring-lbl">used</div>
                  </div>
                </div>

                <div className="budget-info">
                  <h3 style={{ color: percentUsed > 100 ? '#ff3b30' : percentUsed > 70 ? '#ff9500' : '#00ff88' }}>
                    {Math.max(0, (weeklyBudget - weeklyUsage)).toFixed(1)} kg left
                  </h3>
                  <p>of {weeklyBudget} kg weekly budget</p>
                  <div className="motivational">
                    {percentUsed < 30 ? "You're crushing it! 🎉" :
                      percentUsed <= 70 ? "Stay mindful 🌿" :
                        "Go greener tomorrow 🚌"}
                  </div>
                </div>
              </div>

              <div className="card-label">Daily Breakdown</div>
              <div className="bar-chart">
                {pastData.map((val, idx) => {
                  const heightPct = (val / maxBar) * 100;
                  const isToday = idx === todayIndex;
                  let barClass = 'bar';
                  if (isToday) {
                    barClass += val > 8 ? ' bar-today-red' : val > 4 ? ' bar-today-orange' : ' bar-today';
                  }
                  return (
                    <div key={idx} className="bar-wrapper">
                      <div className={barClass} style={{ height: `${Math.max(4, heightPct)}%` }}></div>
                      <div className={`day-lbl ${isToday ? 'day-lbl-today' : ''}`}>{getDayLabel(idx)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Emission Breakdown — from Stitch Dashboard */}
              <div className="card-label" style={{ marginTop: '20px' }}>Emission Breakdown</div>
              {activities.length === 0 ? (
                <div className="activities-empty">
                  Track your first activity to see breakdown
                </div>
              ) : (
                <div>
                  {activities.slice(0, 5).map(act => (
                    <div key={act.id} className="breakdown-item">
                      <div className="breakdown-icon">
                        {act.category === 'transportation' ? '🚗' :
                          act.category === 'food' ? '🍽️' :
                            act.category === 'energy' ? '⚡' : '📦'}
                      </div>
                      <div className="breakdown-info">
                        <div className="breakdown-name">{act.activity}</div>
                        <div className="breakdown-sub">{act.category}</div>
                      </div>
                      <div className="breakdown-value" style={{ color: co2Color(act.kg_co2) }}>
                        {act.kg_co2} <span className="breakdown-unit">kg CO₂</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ ECO TIPS VIEW — from Stitch Eco Tips ══════════ */}
        {activeNav === 'tips' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="panel">
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌿</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                  Reduce Your Carbon Footprint
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
                  Small adjustments in your daily routine can lead to a significant environmental impact.
                  Discover simple ways to contribute to a greener planet today.
                </p>
              </div>
            </div>

            {ecoTips.map((tip, idx) => (
              <div key={idx} className="eco-tip-card">
                <div className="eco-tip-header">
                  <div className="eco-tip-icon">{tip.icon}</div>
                  <div>
                    <div className="eco-tip-title">{tip.title}</div>
                    <div className="eco-tip-savings">{tip.savings}</div>
                  </div>
                </div>
                <div className="eco-tip-desc">{tip.desc}</div>
                {tip.badges && (
                  <div className="eco-tip-badges">
                    {tip.badges.map((b, i) => (
                      <div key={i} className="eco-tip-badge">
                        <span>✓</span> {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════ STATS VIEW ══════════ */}
        {activeNav === 'stats' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-label">Comparison</div>
              <div className="stats-header">
                <div className="ring-chart">
                  <svg width="120" height="120" className="ring-svg">
                    <circle cx="60" cy="60" r={circleRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r={circleRadius}
                      fill="none"
                      stroke={percentUsed > 100 ? '#ff3b30' : percentUsed > 70 ? '#ff9500' : '#00ff88'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="ring-center">
                    <div className="ring-pct">{percentUsed}%</div>
                    <div className="ring-lbl">budget used</div>
                  </div>
                </div>
                <div className="budget-info">
                  <h3 style={{ color: '#00ff88' }}>{weeklyUsage.toFixed(1)} kg</h3>
                  <p>total this week</p>
                  <div className="motivational">
                    {activities.length} activities tracked
                  </div>
                </div>
              </div>

              <div className="card-label" style={{ marginTop: '16px' }}>Weekly Chart</div>
              <div className="bar-chart">
                {pastData.map((val, idx) => {
                  const heightPct = (val / maxBar) * 100;
                  const isToday = idx === todayIndex;
                  let barClass = 'bar';
                  if (isToday) {
                    barClass += val > 8 ? ' bar-today-red' : val > 4 ? ' bar-today-orange' : ' bar-today';
                  }
                  return (
                    <div key={idx} className="bar-wrapper">
                      <div className={barClass} style={{ height: `${Math.max(4, heightPct)}%` }}></div>
                      <div className={`day-lbl ${isToday ? 'day-lbl-today' : ''}`}>{getDayLabel(idx)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full activity log */}
            <div className="card">
              <div className="card-label">All Activities</div>
              {activities.length === 0 ? (
                <div className="activities-empty">
                  🌱 No activities logged yet
                </div>
              ) : (
                <div>
                  {activities.map(act => (
                    <div key={act.id} className="breakdown-item">
                      <div className="breakdown-icon">
                        {act.category === 'transportation' ? '🚗' :
                          act.category === 'food' ? '🍽️' :
                            act.category === 'energy' ? '⚡' : '📦'}
                      </div>
                      <div className="breakdown-info">
                        <div className="breakdown-name">{act.activity}</div>
                        <div className="breakdown-sub">{act.category} • {act.confidence || 'high'} confidence</div>
                      </div>
                      <div className="breakdown-value" style={{ color: co2Color(act.kg_co2) }}>
                        {act.kg_co2} <span className="breakdown-unit">kg CO₂</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════ BOTTOM NAVIGATION — from Stitch screens ══════════ */}
      <nav className="bottom-nav">
        <div className="nav-inner">
          <button
            className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
            onClick={() => setActiveNav('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </button>
          <button
            className={`nav-item ${activeNav === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveNav('stats')}
          >
            <span className="nav-icon">📊</span>
            Stats
          </button>
          <button
            className={`nav-item ${activeNav === 'tips' ? 'active' : ''}`}
            onClick={() => setActiveNav('tips')}
          >
            <span className="nav-icon">🌿</span>
            Eco Tips
          </button>
          <button
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </div>
      </nav>

    </React.Fragment>
  );
}
