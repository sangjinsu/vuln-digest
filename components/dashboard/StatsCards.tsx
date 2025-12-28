'use client';

import { AlertTriangle, Shield, TrendingUp, Clock } from 'lucide-react';
import { VulnResponse } from '@/lib/types';
import { useCountUp } from '@/lib/hooks';

interface StatsCardsProps {
  data: VulnResponse | null;
  loading?: boolean;
}

// 개별 숫자 카운터 컴포넌트 (리렌더링 격리)
function AnimatedNumber({ value, loading }: { value: number; loading?: boolean }) {
  const count = useCountUp({ end: value, duration: 800, delay: 100 });

  if (loading) {
    return <div className="h-7 w-12 animate-pulse rounded bg-bg-secondary" />;
  }

  return (
    <span className="text-2xl font-bold text-star tabular-nums">
      {count}
    </span>
  );
}

export default function StatsCards({ data, loading }: StatsCardsProps) {
  const stats = [
    {
      label: 'Critical',
      value: data?.meta.severities.critical ?? 0,
      icon: AlertTriangle,
      bgColor: 'bg-severity-critical/20',
      textColor: 'text-severity-critical',
    },
    {
      label: 'High',
      value: data?.meta.severities.high ?? 0,
      icon: Shield,
      bgColor: 'bg-severity-high/20',
      textColor: 'text-severity-high',
    },
    {
      label: '전체',
      value: data?.meta.total ?? 0,
      icon: TrendingUp,
      bgColor: 'bg-star-blue/20',
      textColor: 'text-star-blue',
    },
    {
      label: '마지막 업데이트',
      value: data?.meta.fetchedAt
        ? new Date(data.meta.fetchedAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      icon: Clock,
      bgColor: 'bg-star-purple/20',
      textColor: 'text-star-purple',
      isTime: true,
    },
  ];

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border-default bg-bg-card p-4 hover:border-border-hover transition-all duration-200"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${stat.bgColor} p-2.5`}>
              <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">{stat.label}</p>
              {stat.isTime ? (
                loading ? (
                  <div className="h-6 w-14 animate-pulse rounded bg-bg-secondary" />
                ) : (
                  <p className="text-lg font-medium text-star">{stat.value}</p>
                )
              ) : (
                <AnimatedNumber value={stat.value as number} loading={loading} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
