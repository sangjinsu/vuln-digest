import { AlertTriangle, Shield, TrendingUp, Clock } from 'lucide-react';
import { VulnResponse } from '@/lib/types';

interface StatsCardsProps {
  data: VulnResponse | null;
  loading?: boolean;
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
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border-default bg-bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${stat.bgColor} p-3`}>
              <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{stat.label}</p>
              {loading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-bg-secondary" />
              ) : (
                <p
                  className={`${
                    stat.isTime ? 'text-lg font-medium' : 'text-2xl font-bold'
                  } text-star`}
                >
                  {stat.value}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
