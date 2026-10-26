import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProviders } from '@/components/auth/AuthProviders';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'light' ? false : stored === 'dark' ? true : (!stored ? true : systemDark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: 'Nova Request — API workspace',
    template: '%s · Nova Request',
  },
  description:
    'A focused API testing workspace for building requests, managing collections and environments, and inspecting responses.',
  applicationName: 'Nova Request',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0c10' },
    { media: '(prefers-color-scheme: light)', color: '#f5f6f9' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProviders>
            {children}
            <Toaster
              position="bottom-right"
              gutter={10}
              toastOptions={{
                duration: 3600,
                style: {
                  background: 'hsl(var(--surface-2))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 16px 48px -16px hsl(0 0% 0% / 0.6)',
                  fontSize: '13px',
                  padding: '10px 14px',
                },
                success: {
                  iconTheme: {
                    primary: 'hsl(var(--success))',
                    secondary: 'hsl(var(--surface-2))',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'hsl(var(--destructive))',
                    secondary: 'hsl(var(--surface-2))',
                  },
                },
              }}
            />
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
