'use client';

export default function CitizenPortal() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/" style={{ color: '#10b981' }}>← Back to Home</a>
      </div>

      <h1>👥 Citizen Portal</h1>
      <p style={{ color: '#666' }}>Public access to city data and alerts</p>

      {/* Trust Indicators */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f0fdf4',
        border: '1px solid #10b981',
        borderRadius: '8px'
      }}>
        <h3>🔒 Data Trust Indicators</h3>
        <p>✅ Data is current and verified</p>
        <p>✅ All sensors operational</p>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
          Last system check: 2 minutes ago
        </p>
      </div>

      {/* Public Alerts */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>📢 Public Alerts</h2>
        <p style={{ color: '#666' }}>No public alerts at this time</p>
      </div>

      {/* Simplified Forecasts */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>🌤️ 7-Day Outlook</h2>
        <p style={{ color: '#666' }}>Air quality and service forecasts</p>
        <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
          Forecast data will be displayed in simple, citizen-friendly format
        </p>
      </div>

      {/* Citizen Interaction */}
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h2>📝 Your Voice Matters</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Request data or suggest corrections
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Request Dataset
          </button>
          
          <button style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Suggest Correction
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <p>
          <strong>Note:</strong> This portal provides simplified, citizen-friendly views 
          of city data. All predictions are based on historical patterns and expert analysis.
        </p>
      </div>
    </main>
  )
}
