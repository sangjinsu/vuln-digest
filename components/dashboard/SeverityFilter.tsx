'use client';

import { Severity, SEVERITY_COLORS } from '@/lib/types';

interface SeverityFilterProps {
  selected: Severity[];
  onSelect: (severities: Severity[]) => void;
}

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function SeverityFilter({ selected, onSelect }: SeverityFilterProps) {
  const handleToggle = (severity: Severity) => {
    if (selected.includes(severity)) {
      onSelect(selected.filter((s) => s !== severity));
    } else {
      onSelect([...selected, severity]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {SEVERITIES.map(({ value, label }) => {
        const isSelected = selected.includes(value);

        return (
          <button
            key={value}
            onClick={() => handleToggle(value)}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
              border
              ${
                isSelected
                  ? `${SEVERITY_COLORS[value]} text-white border-transparent`
                  : 'bg-bg-card text-text-secondary border-border-default hover:border-border-hover'
              }
            `}
          >
            <span
              className={`
                h-2 w-2 rounded-full
                ${isSelected ? 'bg-white' : SEVERITY_COLORS[value]}
              `}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
