import Link from 'next/link';
import { Shield, FileText, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 text-star hover:text-star-blue transition-colors">
          <Shield className="h-8 w-8 text-star-purple" />
          <span className="text-xl font-bold">VulnDigest</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-secondary hover:text-star transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">대시보드</span>
          </Link>
          <Link
            href="/report"
            className="flex items-center gap-1.5 text-text-secondary hover:text-star transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">보고서</span>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-text-secondary hover:text-star transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
