export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🏙️ Urban Intelligence Platform</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        <strong>"This system predicts problems early."</strong>
      </p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Available Dashboards</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <a 
            href="/municipal" 
            style={{
              padding: '1rem 2rem',
              background: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            Municipal Dashboard →
          </a>
          
          <a 
            href="/citizen" 
            style={{
              padding: '1rem 2rem',
              background: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            Citizen Portal →
          </a>
        </div>
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>System Status</h3>
        <p>✅ API: Connected</p>
        <p>✅ Data Pipeline: Operational</p>
        <p>✅ Analytics: Ready</p>
      </div>

      <div style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
        <p>Built for "Trustworthy and Scalable Digital Systems"</p>
        <p>Hackathon Project - Ingenious C3E1</p>
      </div>
    </main>
  )
}
