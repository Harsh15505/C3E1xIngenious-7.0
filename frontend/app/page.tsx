export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Redirect to citizen dashboard - this is now the main page */}
      <meta httpEquiv="refresh" content="0; url=/citizen/dashboard" />
    </main>
  )
}
