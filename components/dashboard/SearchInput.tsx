'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'CVE ID, 제목, 설명 검색...',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // 외부 값 변경 시 동기화
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-default bg-bg-card pl-10 pr-10 py-2.5
                   text-sm text-star placeholder:text-text-muted
                   focus:border-star-purple focus:outline-none focus:ring-1 focus:ring-star-purple
                   transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-star transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
