import { Shield } from 'lucide-react';
import { Vulnerability } from '@/lib/types';
import VulnCard from './VulnCard';

interface VulnListProps {
  vulnerabilities: Vulnerability[];
  loading?: boolean;
  searchQuery?: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border-default bg-bg-card p-4 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-28 rounded bg-bg-secondary" />
            <div className="h-4 w-14 rounded bg-bg-secondary" />
          </div>
          <div className="h-4 w-3/4 rounded bg-bg-secondary mb-1.5" />
          <div className="h-3 w-full rounded bg-bg-secondary mb-1" />
          <div className="h-3 w-2/3 rounded bg-bg-secondary" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted animate-fade-in-up">
      <Shield className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm">선택한 기간에 취약점이 없습니다</p>
      <p className="text-xs mt-1 opacity-70">다른 기간을 선택해보세요</p>
    </div>
  );
}

export default function VulnList({ vulnerabilities, loading, searchQuery }: VulnListProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (vulnerabilities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {vulnerabilities.map((vuln, index) => (
        <div
          key={`${vuln.source}-${vuln.id}`}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        >
          <VulnCard vulnerability={vuln} searchQuery={searchQuery} />
        </div>
      ))}
    </div>
  );
}
