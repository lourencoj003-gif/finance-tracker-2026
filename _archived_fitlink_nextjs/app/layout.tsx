import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitLink — Fitness That Works Between Sessions',
  description: 'Connect with your trainer, track your progress, and hit your goals with FitLink.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
