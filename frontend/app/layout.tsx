import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Urban Intelligence Platform',
  description: 'Early risk prediction and decision support for urban systems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
