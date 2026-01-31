import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { EnrollmentModalProvider } from '@/contexts/EnrollmentModalContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Learning System',
  description: 'AI-powered Education Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <EnrollmentModalProvider>
            {children}
          </EnrollmentModalProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

