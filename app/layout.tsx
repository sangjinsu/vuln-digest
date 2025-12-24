import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VulnDigest - 보안 취약점 모니터링',
  description: 'AI가 정리해주는 보안 취약점 브리핑 서비스',
  keywords: ['보안', '취약점', 'CVE', 'security', 'vulnerability'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-border-default bg-bg-secondary py-4">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-text-muted">
              <p>&copy; {new Date().getFullYear()} VulnDigest. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
