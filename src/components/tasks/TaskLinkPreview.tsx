import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Link2, X, Pencil, Check } from 'lucide-react';

interface TaskLinkPreviewProps {
  url: string;
  onRemove?: () => void;
  onUpdate?: (newUrl: string) => void;
  className?: string;
}

export function TaskLinkPreview({ url, onRemove, onUpdate, className = '' }: TaskLinkPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getDomain = (urlString: string): string => {
    try {
      const domain = new URL(urlString).hostname.replace('www.', '');
      return domain;
    } catch {
      return urlString;
    }
  };

  const getFavicon = (urlString: string): string => {
    try {
      const domain = new URL(urlString).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return '';
    }
  };

  const handleSave = () => {
    let newUrl = editValue.trim();
    if (!newUrl) {
      setEditValue(url);
      setIsEditing(false);
      return;
    }
    
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'https://' + newUrl;
    }
    
    if (newUrl !== url && onUpdate) {
      onUpdate(newUrl);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(url);
      setIsEditing(false);
    }
  };

  const domain = getDomain(url);
  const favicon = getFavicon(url);

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-md bg-primary/5 border border-primary/20 ${className}`}>
        <Link2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-foreground focus:outline-none"
        />
        <button
          onClick={handleSave}
          className="p-0.5 text-primary hover:text-primary/80"
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`group/link flex items-center gap-2 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors ${className}`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <img 
          src={favicon} 
          alt="" 
          className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Link2 className="w-3.5 h-3.5 text-primary/60 hidden flex-shrink-0" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {domain}
        </a>
        <ExternalLink className="w-3 h-3 text-primary/40 flex-shrink-0" />
      </div>
      {onUpdate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditValue(url);
            setIsEditing(true);
          }}
          className="opacity-0 group-hover/link:opacity-100 p-0.5 text-foreground/40 hover:text-primary transition-opacity"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover/link:opacity-100 p-0.5 text-foreground/40 hover:text-destructive transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
