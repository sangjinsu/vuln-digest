'use client';

import { VulnSource, SOURCE_INFO, VulnResponse } from '@/lib/types';

type SourceFilter = VulnSource | 'all';

interface SourceTabsProps {
  selected: SourceFilter;
  onSelect: (source: SourceFilter) => void;
  counts?: VulnResponse['meta']['sources'];
}

const AVAILABLE_SOURCES: SourceFilter[] = ['all', 'nvd', 'cisa'];

export default function SourceTabs({ selected, onSelect, counts }: SourceTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {AVAILABLE_SOURCES.map((source) => {
        const isSelected = selected === source;
        const count = source === 'all'
          ? Object.values(counts ?? {}).reduce((a, b) => a + b, 0)
          : counts?.[source] ?? 0;

        const label = source === 'all' ? '전체' : SOURCE_INFO[source].name;

        return (
          <button
            key={source}
            onClick={() => onSelect(source)}
            className={`
              flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${
                isSelected
                  ? 'bg-star-purple text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-secondary hover:text-star'
              }
              border border-border-default
            `}
          >
            <span>{label}</span>
            <span
              className={`
                rounded-full px-2 py-0.5 text-xs
                ${isSelected ? 'bg-white/20' : 'bg-bg-secondary'}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
