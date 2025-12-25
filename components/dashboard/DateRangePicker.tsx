'use client';

import { Calendar } from 'lucide-react';
import { DateRange } from '@/lib/types';

interface DateRangePickerProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
}

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24시간' },
  { value: 'week', label: '1주일' },
  { value: 'month', label: '1개월' },
];

export default function DateRangePicker({ selected, onSelect }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-text-muted" />
      <div className="flex rounded-lg border border-border-default bg-bg-card p-1">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onSelect(range.value)}
            className={`
              rounded-md px-3 py-1.5 text-sm font-medium transition-colors
              ${
                selected === range.value
                  ? 'bg-star-purple text-white'
                  : 'text-text-secondary hover:text-star'
              }
            `}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
