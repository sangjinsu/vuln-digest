'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className={`
        flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
        transition-all duration-200 active:scale-95
        ${
          copied
            ? 'bg-severity-low/20 text-severity-low'
            : text
              ? 'bg-bg-secondary text-text-secondary hover:bg-bg-card hover:text-star'
              : 'bg-bg-secondary text-text-muted cursor-not-allowed'
        }
      `}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 animate-scale-in" />
          복사됨
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          마크다운 복사
        </>
      )}
    </button>
  );
}
