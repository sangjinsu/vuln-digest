import Link from 'next/link';
import { Shield, FileText, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-star hover:text-star-blue transition-all duration-200 group"
        >
          <Shield className="h-6 w-6 text-star-purple group-hover:scale-110 transition-transform" />
          <span className="text-lg font-bold">VulnDigest</span>
        </Link>

        {/* 네비게이션 - 아이콘 중심 */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            title="대시보드"
            className="p-2 rounded-lg text-text-secondary hover:text-star hover:bg-bg-card transition-all duration-200 group"
          >
            <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </Link>
          <Link
            href="/report"
            title="보고서"
            className="p-2 rounded-lg text-text-secondary hover:text-star hover:bg-bg-card transition-all duration-200 group"
          >
            <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="p-2 rounded-lg text-text-secondary hover:text-star hover:bg-bg-card transition-all duration-200 group"
          >
            <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </a>
        </nav>
      </div>
    </header>
  );
}
