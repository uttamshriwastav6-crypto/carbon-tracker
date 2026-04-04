import React, { useState } from 'react';

export default function App() {
  const [sms, setSms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [smsError, setSmsError] = useState('');

  const [activities, setActivities] = useState([]);

  const [nudge, setNudge] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState('');

  const [activeTab, setActiveTab] = useState('sms');
  const [speed, setSpeed] = useState('');
  const [transportResult, setTransportResult] = useState(null);
  const [tripMode, setTripMode] = useState('');
  const [distance, setDistance] = useState('');
  const [tripResult, setTripResult] = useState(null);

  const co2Color = (kg) => {
    if (kg < 1) return 'var(--green)';
    if (kg <= 5) return 'var(--orange)';
    return 'var(--red)';
  };

  const impactLabel = (kg) => {
    if (kg < 1) return 'Low impact';
    if (kg <= 5) return 'Moderate';
    return 'High impact';
  };

  const impactBadgeStyle = (kg) => {
    if (kg < 1) return { backgroundColor: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--border-green)' };
    if (kg <= 5) return { backgroundColor: 'rgba(255,149,0,0.1)', color: 'var(--orange)', border: '1px solid rgba(255,149,0,0.25)' };
    return { backgroundColor: 'rgba(255,59,48,0.1)', color: 'var(--red)', border: '1px solid rgba(255,59,48,0.25)' };
  };

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

  const handleDetectTransport = async () => {
    if (!speed) return;
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
    }
  };

  const handleLogTrip = async () => {
    if (!tripMode || !distance) return;
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
    }
  };

  const handleGetNudge = async () => {
    if (activities.length === 0) return;
    setNudgeLoading(true);
    setNudgeError('');
    setNudge('');
    try {
      const totalKg = activities.reduce((sum, a) => sum + (a.kg_co2 || 0), 0);
      const response = await fetch('https://carbon-trackers.onrender.com/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: activities.map(a => a.activity),
          total_kg: totalKg,
          user_name: "friend"
        })
      });
      if (!response.ok) throw new Error('Failed to fetch AI nudge');
      const data = await response.json();
      setNudge(data.nudge || data.message || "Keep up the good work!");
    } catch (err) {
      setNudgeError('AI Coach is unreachable right now.');
    } finally {
      setNudgeLoading(false);
    }
  };

  const totalKg = activities.reduce((sum, a) => sum + (a.kg_co2 || 0), 0);
  const weeklyBudget = 70;

  // Create a realistic trailing week for the chart
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0-6 where Mon=0
  const pastData = [2.1, 3.4, 1.8, 5.2, 2.9, 4.1, 0];
  pastData[todayIndex] = totalKg; // Replace today with actual tracked
  const maxBar = Math.max(...pastData, 10);

  const weeklyUsage = pastData.reduce((a, b) => a + b, 0);
  const percentUsed = Math.min(100, Math.round((weeklyUsage / weeklyBudget) * 100));
  const circleRadius = 38;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const offset = circleCircumference - (percentUsed / 100) * circleCircumference;

  const getDayLetter = (idx) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx];

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        :root {
          --bg: #0a0a0a;
          --bg2: #111111;
          --bg3: #181818;
          --border: rgba(255,255,255,0.07);
          --border-green: rgba(0,255,136,0.25);
          --green: #00ff88;
          --green-dim: rgba(0,255,136,0.10);
          --orange: #ff9500;
          --red: #ff3b30;
          --text: #e8e8e8;
          --text-muted: #555555;
          --text-dim: #333333;
          --sans: 'Space Grotesk', sans-serif;
          --mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          min-height: 100vh;
        }

        .container {
          max-width: 920px;
          margin: 0 auto;
          padding: 24px;
        }

        /* SECTION 1: HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          background-color: var(--green-dim);
          border: 1px solid var(--border-green);
          border-radius: 12px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .logo-title {
          font-size: 22px;
          font-weight: 700;
        }
        
        .logo-title .sense {
          color: var(--green);
        }

        .logo-subtitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .header-right {
          text-align: right;
        }

        .date-text {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .live-tracking {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--green);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: var(--green);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* SECTION 2: INPUT PANEL */
        .input-panel {
          background-color: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tab {
          padding: 8px 16px;
          border-radius: 99px;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .tab.active {
          background-color: var(--green);
          color: #000;
        }

        .input-box {
          background-color: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 12px;
          width: 100%;
          padding: 14px;
          resize: none;
          transition: border-color 0.2s;
        }
        
        .input-box:focus {
          outline: none;
          border-color: var(--border-green);
        }

        textarea.input-box {
          min-height: 100px;
        }
        
        input.input-box {
          height: 44px;
        }

        .btn {
          width: 100%;
          margin-top: 12px;
          background-color: var(--green);
          color: #000;
          font-weight: 700;
          font-family: var(--sans);
          font-size: 15px;
          border-radius: 10px;
          padding: 13px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        
        .spinner-green {
          border: 2px solid rgba(0,255,136,0.2);
          border-top-color: var(--green);
        }

        .error-msg {
          background-color: rgba(255,59,48,0.1);
          color: var(--red);
          border: 1px solid rgba(255,59,48,0.25);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 12px;
        }
        
        .info-msg {
          background-color: var(--green-dim);
          color: var(--green);
          border: 1px solid var(--border-green);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 12px;
        }

        .result-card {
          background-color: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px;
          margin-top: 14px;
          animation: slideUp 0.3s ease;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .result-activity {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .result-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge-gray {
          background-color: rgba(255,255,255,0.05);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }
        
        .badge-good {
          background-color: var(--green-dim);
          color: var(--green);
          border: 1px solid var(--border-green);
        }

        .co2-val {
          font-family: var(--mono);
          font-size: 32px;
          font-weight: 500;
          line-height: 1;
        }

        .co2-unit {
          font-family: var(--sans);
          font-size: 16px;
          color: var(--text-muted);
        }

        .tip-box {
          background-color: rgba(0,255,136,0.06);
          border: 1px solid rgba(0,255,136,0.18);
          border-radius: 8px;
          padding: 11px 14px;
          margin-top: 16px;
          font-size: 13px;
          color: #99ffcc;
          line-height: 1.5;
        }
        
        .tip-box strong {
          color: var(--green);
        }

        .pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        
        .pill-btn {
          background-color: var(--bg3);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 16px;
          border-radius: 99px;
          font-family: var(--sans);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pill-btn:hover {
          background-color: var(--bg2);
          border-color: var(--text-muted);
        }
        
        .pill-btn.selected {
          background-color: var(--green-dim);
          border-color: var(--green);
          color: var(--green);
        }

        /* SECTION 3: GRID */
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .card {
          background-color: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
        }

        .card-label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .total-display {
          margin-bottom: 24px;
        }

        .total-num {
          font-family: var(--mono);
          font-size: 52px;
          font-weight: 500;
          line-height: 1;
        }
        
        .total-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .progress-container {
          margin-bottom: 32px;
        }

        .progress-track {
          height: 6px;
          background-color: var(--bg3);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .activities-empty {
          border: 1px dashed var(--border);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
        }

        .activity-row {
          background-color: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .act-name {
          font-size: 13px;
          font-weight: 500;
        }

        .act-cat {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          text-transform: capitalize;
        }

        .act-kg {
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 500;
        }

        .stats-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }

        .ring-chart {
          width: 90px;
          height: 90px;
          position: relative;
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
          font-size: 16px;
          color: var(--text);
        }
        
        .ring-lbl {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .budget-info h3 {
          font-family: var(--mono);
          font-size: 28px;
          color: var(--green);
          font-weight: 400;
          margin: 0;
          line-height: 1.1;
        }

        .budget-info p {
          font-size: 12px;
          color: var(--text-muted);
          margin: 4px 0 8px 0;
        }

        .budget-info .motivational {
          font-size: 13px;
          color: var(--text);
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 100px;
          margin-bottom: 24px;
          padding-bottom: 20px;
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
          border-radius: 4px;
          background-color: var(--border);
          transition: height 0.3s ease;
        }
        
        .bar.today {
          background-color: var(--green);
          box-shadow: 0 0 12px rgba(0,255,136,0.2);
        }
        
        .bar.today-orange { background-color: var(--orange); box-shadow: 0 0 12px rgba(255,149,0,0.2); }
        .bar.today-red { background-color: var(--red); box-shadow: 0 0 12px rgba(255,59,48,0.2); }

        .day-lbl {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .day-lbl.today {
          color: var(--text);
          font-weight: 700;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--green);
          color: var(--green);
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-outline:not(:disabled) {
          animation: glowPulse 3s infinite;
        }
        
        .btn-outline:not(:disabled):hover {
          background-color: var(--green-dim);
        }

        .nudge-card {
          background: linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,180,80,0.03));
          border: 1px solid rgba(0,255,136,0.3);
          box-shadow: 0 0 30px rgba(0,255,136,0.07);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
          animation: slideUp 0.3s ease;
        }
        
        .nudge-header {
          font-size: 11px;
          color: var(--green);
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .nudge-text {
          font-size: 14px;
          color: #c8ffd8;
          line-height: 1.65;
        }

        /* ANIMATIONS */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(0,255,136,0); }
          50% { box-shadow: 0 0 15px rgba(0,255,136,0.3); }
        }
      `}</style>

      <div className="container">

        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <div className="logo-icon">🌍</div>
            <div>
              <div className="logo-title">
                Carbon<span className="sense">Sense</span>
              </div>
              <div className="logo-subtitle">Your autonomous carbon coach</div>
            </div>
          </div>
          <div className="header-right">
            <div className="date-text">{todayStr}</div>
            <div className="live-tracking">
              <div className="pulse-dot"></div>
              TRACKING LIVE
            </div>
          </div>
        </header>

        {/* INPUT PANEL */}
        <div className="input-panel">
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
            <div>
              <textarea
                className="input-box"
                value={sms}
                onChange={e => setSms(e.target.value)}
                placeholder={"Paste any Indian SMS here...\n\nExamples:\n• Your Ola ride of 12.5 km is complete. Fare ₹185\n• Your IRCTC train booking Chennai→Mumbai 1400 km confirmed\n• BPCL: 10 litres dispensed at pump #3\n• Your Swiggy order has been delivered!"}
              />
              <button
                className="btn"
                onClick={handleAnalyseSMS}
                disabled={loading || !sms.trim()}
              >
                {loading ? <><div className="spinner"></div> Analysing…</> : '⚡ Analyse SMS'}
              </button>

              {smsError && <div className="error-msg">{smsError}</div>}

              {result && (
                <div className="result-card">
                  <div className="result-header">
                    <div>
                      <div className="result-activity">{result.activity || 'Activity'}</div>
                      <div className="result-badges">
                        <span className="badge" style={impactBadgeStyle(result.kg_co2)}>
                          {impactLabel(result.kg_co2)}
                        </span>
                        <span className="badge badge-gray">{result.category}</span>
                        <span className={`badge ${result.confidence === 'high' ? 'badge-good' : 'badge-gray'}`}>
                          {result.confidence} conf
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="co2-val" style={{ color: co2Color(result.kg_co2) }}>
                        {result.kg_co2}
                      </span>
                      <div className="co2-unit">kg CO₂</div>
                    </div>
                  </div>
                  {result.tip && (
                    <div className="tip-box">
                      <strong>💡</strong> {result.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <div>
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>Current Speed (km/h)</div>
              <input
                className="input-box"
                type="number"
                value={speed}
                onChange={e => setSpeed(e.target.value)}
                placeholder="e.g. 45"
              />
              <button
                className="btn"
                onClick={handleDetectTransport}
                disabled={!speed}
                style={{ marginTop: '12px' }}
              >
                🔍 Detect Transport Mode
              </button>

              {transportResult && (
                <div style={{ marginTop: '16px' }}>
                  <div className="info-msg">{transportResult.notification_message}</div>

                  {transportResult.needs_confirmation && transportResult.possible_modes && (
                    <div className="pill-group">
                      {transportResult.possible_modes.map(m => (
                        <button
                          key={m}
                          className={`pill-btn ${tripMode === m ? 'selected' : ''}`}
                          onClick={() => setTripMode(m)}
                        >
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tripMode && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>Distance Travelled (km)</div>
                  <input
                    className="input-box"
                    type="number"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    placeholder="e.g. 12.5"
                  />
                  <button
                    className="btn"
                    onClick={handleLogTrip}
                    disabled={!distance}
                    style={{ marginTop: '12px' }}
                  >
                    📍 Log This Trip
                  </button>

                  {tripResult && (
                    <div className="result-card">
                      <div className="result-header">
                        <div>
                          <div className="result-activity">{tripResult.activity || 'Trip'}</div>
                          <div className="result-badges">
                            <span className="badge" style={impactBadgeStyle(tripResult.kg_co2)}>
                              {impactLabel(tripResult.kg_co2)}
                            </span>
                            <span className="badge badge-gray">transportation</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="co2-val" style={{ color: co2Color(tripResult.kg_co2) }}>
                            {tripResult.kg_co2}
                          </span>
                          <div className="co2-unit">kg CO₂</div>
                        </div>
                      </div>
                      {tripResult.tip && (
                        <div className="tip-box">
                          <strong>💡</strong> {tripResult.tip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* GRID SECTION */}
        <div className="grid">

          {/* Card: Today's Footprint */}
          <div className="card">
            <div className="card-label">Today's Footprint</div>

            <div className="total-display">
              <span className="total-num" style={{ color: co2Color(totalKg) }}>
                {totalKg.toFixed(1)}
              </span>
              <span style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '8px' }}>kg CO₂</span>
              <div className="total-sub">of 10 kg daily limit</div>
            </div>

            <div className="progress-container">
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

            <div className="card-label" style={{ marginTop: '20px' }}>Logged Activities</div>
            {activities.length === 0 ? (
              <div className="activities-empty">
                No activities yet. Paste an SMS or log a trip above.
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

          {/* Card: Goals & AI Coach */}
          <div className="card">
            <div className="card-label">Weekly Budget</div>

            <div className="stats-header">
              <div className="ring-chart">
                <svg width="90" height="90" className="ring-svg">
                  <circle
                    cx="45" cy="45" r={circleRadius}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
                  />
                  <circle
                    cx="45" cy="45" r={circleRadius}
                    fill="none"
                    stroke={percentUsed > 100 ? 'var(--red)' : percentUsed > 70 ? 'var(--orange)' : 'var(--green)'}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="ring-center">
                  <div className="ring-pct">{percentUsed}%</div>
                  <div className="ring-lbl">used</div>
                </div>
              </div>

              <div className="budget-info">
                <h3 style={{ color: percentUsed > 100 ? 'var(--red)' : percentUsed > 70 ? 'var(--orange)' : 'var(--green)' }}>
                  {Math.max(0, (weeklyBudget - weeklyUsage)).toFixed(1)} kg left
                </h3>
                <p>of 70 kg weekly budget</p>
                <div className="motivational">
                  {percentUsed < 30 ? "You're crushing it! 🎉" :
                    percentUsed <= 70 ? "Stay mindful 🌿" :
                      "Go greener tomorrow 🚌"}
                </div>
              </div>
            </div>

            <div className="bar-chart">
              {pastData.map((val, idx) => {
                const heightPct = (val / maxBar) * 100;
                const isToday = idx === todayIndex;
                let barClass = 'bar';
                if (isToday) {
                  barClass += val > 8 ? ' today-red' : val > 4 ? ' today-orange' : ' today';
                }
                return (
                  <div key={idx} className="bar-wrapper">
                    <div className={barClass} style={{ height: `${Math.max(4, heightPct)}%` }}></div>
                    <div className={`day-lbl ${isToday ? 'today' : ''}`}>{getDayLetter(idx)}</div>
                  </div>
                );
              })}
            </div>

            <div className="card-label">AI Coach</div>
            <button
              className="btn btn-outline"
              onClick={handleGetNudge}
              disabled={activities.length === 0 || nudgeLoading}
            >
              {nudgeLoading ? <div className="spinner spinner-green"></div> : '✨ Get AI Advice'}
            </button>

            {nudgeError && <div className="error-msg">{nudgeError}</div>}

            {nudge && (
              <div className="nudge-card">
                <div className="nudge-header">🤖 CarbonSense AI</div>
                <div className="nudge-text">{nudge}</div>
              </div>
            )}

          </div>

        </div>
      </div>
    </React.Fragment>
  );
}
