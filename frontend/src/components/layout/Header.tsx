'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Moon, Sun, History, FileText } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-bold text-lg">
          Nova Request
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/dashboard/history">
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}