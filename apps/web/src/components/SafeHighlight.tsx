'use client';

import DOMPurify from 'dompurify';

interface SafeHighlightProps {
  htmlContent: string;
  className?: string;
}

export function SafeHighlight({ htmlContent, className }: SafeHighlightProps) {

  const cleanHtml = typeof window !== 'undefined'
    ? DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: ['mark'] })
    : htmlContent.replace(/<[^>]*>?/gm, ''); 

  return (
    <span
      className={`[&>mark]:bg-indigo-500/20 [&>mark]:text-indigo-300 [&>mark]:rounded-sm [&>mark]:px-0.5 [&>mark]:font-semibold ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}