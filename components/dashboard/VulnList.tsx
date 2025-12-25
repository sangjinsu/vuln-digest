import { Shield } from 'lucide-react';
import { Vulnerability } from '@/lib/types';
import VulnCard from './VulnCard';

interface VulnListProps {
  vulnerabilities: Vulnerability[];
  loading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border-default bg-bg-card p-4 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-32 rounded bg-bg-secondary" />
            <div className="h-5 w-16 rounded bg-bg-secondary" />
          </div>
          <div className="h-4 w-3/4 rounded bg-bg-secondary mb-2" />
          <div className="h-3 w-full rounded bg-bg-secondary mb-1" />
          <div className="h-3 w-2/3 rounded bg-bg-secondary" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <Shield className="h-12 w-12 mb-4 opacity-50" />
      <p>선택한 기간에 취약점이 없습니다</p>
      <p className="text-sm mt-1">다른 기간을 선택해보세요</p>
    </div>
  );
}

export default function VulnList({ vulnerabilities, loading }: VulnListProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (vulnerabilities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {vulnerabilities.map((vuln) => (
        <VulnCard key={`${vuln.source}-${vuln.id}`} vulnerability={vuln} />
      ))}
    </div>
  );
}
