import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, CheckCircle, MessageSquare, BookOpen } from 'lucide-react';
import { useSearch, SearchResult } from '@/hooks/useSearch';
import { formatDistanceToNow } from 'date-fns';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const Search = ({ isOpen, onClose }: SearchProps) => {
  const [query, setQuery] = useState('');
  const { results } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        // Navigate to task's location
        navigate('/inbox'); // or wherever the task lives
        break;
      case 'thought':
        navigate('/thoughts');
        break;
      case 'journal':
        navigate('/journal');
        break;
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'thought': return <MessageSquare className="w-4 h-4" />;
      case 'journal': return <BookOpen className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
        <div className="bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5">
            <SearchIcon className="w-5 h-5 text-foreground/30" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, thoughts, journal..."
              className="flex-1 bg-transparent font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="text-foreground/30 hover:text-foreground/50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <p className="text-sm text-muted-foreground/40 text-center py-8">
                Type to search...
              </p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground/40 text-center py-8">
                No results found
              </p>
            ) : (
              <div>
                {results.map(result => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-foreground/[0.03] text-left transition-colors"
                  >
                    <div className={`mt-0.5 ${result.completed ? 'text-foreground/30' : 'text-foreground/50'}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono text-sm truncate ${
                        result.completed 
                          ? 'text-foreground/40 line-through' 
                          : 'text-foreground/70'
                      }`}>
                        {result.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                        {result.subtitle} · {formatDistanceToNow(new Date(result.date), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-foreground/5">
            <p className="text-[10px] text-muted-foreground/30">
              Esc to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;
