import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Document Upload Portal',
  description: 'Upload and process your documents',
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

