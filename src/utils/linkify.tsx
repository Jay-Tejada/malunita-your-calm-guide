import React from 'react';

// Regex to match URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface LinkifyProps {
  text: string;
  className?: string;
  linkClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const Linkify: React.FC<LinkifyProps> = ({ 
  text, 
  className = '',
  linkClassName = 'text-primary hover:underline',
  onClick 
}) => {
  const parts = text.split(URL_REGEX);
  
  return (
    <span className={className} onClick={onClick}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex since we're reusing it
          URL_REGEX.lastIndex = 0;
          
          // Extract domain for display
          let displayText = part;
          try {
            const url = new URL(part);
            displayText = url.hostname.replace('www.', '');
          } catch {
            displayText = part;
          }
          
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`${linkClassName} inline-flex items-center gap-1`}
            >
              <span className="truncate max-w-[200px]">{displayText}</span>
              <svg 
                className="w-3 h-3 flex-shrink-0 opacity-60" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
            </a>
          );
        }
        // Reset regex lastIndex
        URL_REGEX.lastIndex = 0;
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// Helper to check if text contains a URL
export const containsUrl = (text: string): boolean => {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
};
