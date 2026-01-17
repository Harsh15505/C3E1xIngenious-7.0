'use client';

export default function MunicipalDashboard() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/" style={{ color: '#0070f3' }}>← Back to Home</a>
      </div>

      <h1>🏛️ Municipal Dashboard</h1>
      <p style={{ color: '#666' }}>Decision support for municipal data officers</p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1rem',
        marginTop: '2rem'
      }}>
        {/* City Selector */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }}>
          <h3>City Selection</h3>
          <select style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}>
            <option>Select City...</option>
            <option>City A</option>
            <option>City B</option>
          </select>
        </div>

        {/* Current Metrics */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }}>
          <h3>Current Status</h3>
          <p>AQI: <strong>--</strong></p>
          <p>Water Stress: <strong>--</strong></p>
          <p>Risk Level: <strong>--</strong></p>
        </div>

        {/* Data Freshness */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }}>
          <h3>Data Freshness</h3>
          <p>🟢 All sources: Fresh</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Last update: 5 min ago</p>
        </div>
      </div>

      {/* Scenario Engine Section */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: '#f0f9ff',
        border: '2px solid #0070f3',
        borderRadius: '8px'
      }}>
        <h2>🌟 What-If Scenario Engine</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Test policy decisions before implementation
        </p>
        
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
          <h4>Scenario Input (Placeholder)</h4>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            This will allow testing traffic restrictions, zone policies, and time-window changes
          </p>
          <button style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Run Simulation
          </button>
        </div>
      </div>

      {/* Forecast Section */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>📊 7-Day Forecasts</h2>
        <p style={{ color: '#666' }}>Forecast charts will appear here</p>
      </div>

      {/* Alerts Section */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>🔔 Active Alerts</h2>
        <p style={{ color: '#666' }}>No active alerts</p>
      </div>
    </main>
  )
}
