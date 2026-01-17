export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Urban Intelligence Platform</h1>
          <p className="text-xl text-gray-600">
            <strong>"This system predicts problems early."</strong>
          </p>
        </div>

        {/* Dashboard Options */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Available Dashboards</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="/login"
              className="block p-8 bg-white rounded-lg shadow-lg border-2 border-orange-500 hover:shadow-xl transition group"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Municipal Dashboard</h3>
              </div>
              <p className="text-gray-600">Admin access for city operations, scenario planning, and system monitoring</p>
              <span className="inline-block mt-4 text-orange-500 font-medium group-hover:text-orange-600">
                Sign In →
              </span>
            </a>

            <a 
              href="/login"
              className="block p-8 bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-xl transition group"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Citizen Portal</h3>
              </div>
              <p className="text-gray-600">Public access for alerts, city status, and community information</p>
              <span className="inline-block mt-4 text-orange-500 font-medium group-hover:text-orange-600">
                Sign In →
              </span>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            System Status
          </h3>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-center">
              <span className="text-green-500 mr-2">✅</span> API: Connected
            </p>
            <p className="flex items-center">
              <span className="text-green-500 mr-2">✅</span> Data Pipeline: Operational
            </p>
            <p className="flex items-center">
              <span className="text-green-500 mr-2">✅</span> Analytics: Ready
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Built for "Trustworthy and Scalable Digital Systems"</p>
          <p>Hackathon Project - Ingenious C3E1</p>
        </div>
      </div>
    </main>
  )
}
