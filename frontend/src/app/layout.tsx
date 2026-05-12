import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProviders } from '@/components/auth/AuthProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nova Request',
  description: 'A modern browser-based API testing tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProviders>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'bg-background text-foreground border border-border',
              }}
            />
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}