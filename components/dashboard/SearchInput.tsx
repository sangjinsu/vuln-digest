'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Vulnerability } from '@/lib/types';
import { extractSearchSuggestions } from '@/lib/utils/keywords';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  vulnerabilities?: Vulnerability[];
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  vulnerabilities = [],
  placeholder = 'CVE ID, 제목, 설명 검색...',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

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

  // 키워드 기반 자동완성 제안
  const suggestions = useMemo(() => {
    if (!isFocused || localValue.length < 2 || vulnerabilities.length === 0) {
      return [];
    }

    const allSuggestions = extractSearchSuggestions(vulnerabilities);
    return allSuggestions
      .filter(s => s.toLowerCase().includes(localValue.toLowerCase()))
      .slice(0, 5);
  }, [vulnerabilities, localValue, isFocused]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion);
    onChange(suggestion);
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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

      {/* 자동완성 드롭다운 */}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-bg-card border border-border-default
                       rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 cursor-pointer hover:bg-bg-secondary text-text-secondary
                         hover:text-text-primary transition-colors text-sm"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
