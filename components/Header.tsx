'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrendingUp, Bot } from 'lucide-react';

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="border-b border-dark-400 bg-dark-500/80 backdrop-blur-md sticky top-0 z-50">
      <div className="main-container inner flex justify-between items-center h-20 px-4 sm:px-6 mx-auto max-w-360">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <div className="bg-green-500 p-2 rounded-lg text-dark-900 flex items-center justify-center">
            <TrendingUp width={20} height={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-gray-200 to-green-400 bg-clip-text text-transparent">
            QuantPulse
          </span>
        </Link>

        <nav className="flex items-center h-full gap-2">
          <Link
            href="/"
            className={cn('nav-link px-4 py-5 flex items-center transition-all hover:text-white font-medium h-full text-purple-100 cursor-pointer', {
              'text-white font-semibold border-b-2 border-green-500': pathname === '/',
            })}
          >
            Dashboard
          </Link>

          <Link
            href="/assistant"
            className={cn('nav-link px-4 py-5 flex items-center gap-2 transition-all hover:text-white font-medium h-full text-purple-100 cursor-pointer', {
              'text-white font-semibold border-b-2 border-green-500': pathname === '/assistant',
            })}
          >
            <Bot width={16} height={16} />
            AI Assistant
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
