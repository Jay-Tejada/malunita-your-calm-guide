import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { GripVertical, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { PageBlock, BlockType, BlockContent } from '../types';
import { BlockMenu } from './BlockMenu';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CanvasBlockProps {
  block: PageBlock;
  isSelected?: boolean;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onDelete: () => void;
  onCreateAfter: (blockType?: BlockType) => void;
  onFocus?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const CanvasBlock = ({
  block,
  isSelected,
  onUpdate,
  onDelete,
  onCreateAfter,
  onFocus,
  onMoveUp,
  onMoveDown,
}: CanvasBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const content = block.content as BlockContent;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleTextChange = (text: string) => {
    // Check for slash command
    if (text.startsWith('/')) {
      const filter = text.slice(1);
      setSlashFilter(filter);
      
      if (!showMenu) {
        const rect = textareaRef.current?.getBoundingClientRect();
        if (rect) {
          setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
          setShowMenu(true);
        }
      }
    } else {
      setShowMenu(false);
      setSlashFilter('');
    }

    onUpdate({ content: { ...content, text } });
  };

  const handleBlockTypeSelect = (blockType: BlockType) => {
    setShowMenu(false);
    setSlashFilter('');
    onUpdate({
      block_type: blockType,
      content: { text: '' }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMenu) {
      e.preventDefault();
      onCreateAfter();
    }
    
    if (e.key === 'Backspace' && !content.text && block.block_type === 'text') {
      e.preventDefault();
      onDelete();
    }

    if (e.key === 'ArrowUp' && e.metaKey) {
      e.preventDefault();
      onMoveUp?.();
    }

    if (e.key === 'ArrowDown' && e.metaKey) {
      e.preventDefault();
      onMoveDown?.();
    }
  };

  const handleCheckboxToggle = () => {
    onUpdate({ content: { ...content, checked: !content.checked } });
  };

  const renderBlockContent = () => {
    switch (block.block_type) {
      case 'heading1':
        return (
          <textarea
            ref={textareaRef}
            value={content.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsEditing(true); onFocus?.(); }}
            onBlur={() => setIsEditing(false)}
            placeholder="Heading 1"
            className="w-full bg-transparent resize-none outline-none text-3xl font-bold leading-tight placeholder:text-muted-foreground/50"
            rows={1}
          />
        );

      case 'heading2':
        return (
          <textarea
            ref={textareaRef}
            value={content.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsEditing(true); onFocus?.(); }}
            onBlur={() => setIsEditing(false)}
            placeholder="Heading 2"
            className="w-full bg-transparent resize-none outline-none text-2xl font-semibold leading-tight placeholder:text-muted-foreground/50"
            rows={1}
          />
        );

      case 'heading3':
        return (
          <textarea
            ref={textareaRef}
            value={content.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsEditing(true); onFocus?.(); }}
            onBlur={() => setIsEditing(false)}
            placeholder="Heading 3"
            className="w-full bg-transparent resize-none outline-none text-xl font-medium leading-tight placeholder:text-muted-foreground/50"
            rows={1}
          />
        );

      case 'checklist':
        return (
          <div className="flex items-start gap-2">
            <button
              onClick={handleCheckboxToggle}
              className={cn(
                'w-4 h-4 mt-1 rounded border flex items-center justify-center transition-colors',
                content.checked
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/30 hover:border-primary'
              )}
            >
              {content.checked && <span className="text-xs">✓</span>}
            </button>
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="To-do"
              className={cn(
                'flex-1 bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/50',
                content.checked && 'line-through text-muted-foreground'
              )}
              rows={1}
            />
          </div>
        );

      case 'list':
        return (
          <div className="flex items-start gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/60" />
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="List item"
              className="flex-1 bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/50"
              rows={1}
            />
          </div>
        );

      case 'numbered_list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground tabular-nums">{block.sort_order + 1}.</span>
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="List item"
              className="flex-1 bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/50"
              rows={1}
            />
          </div>
        );

      case 'divider':
        return <hr className="border-t border-border my-2" />;

      case 'callout':
        return (
          <div className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xl">💡</span>
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="Type something..."
              className="flex-1 bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/50"
              rows={1}
            />
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-foreground/20 pl-4">
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="Quote"
              className="w-full bg-transparent resize-none outline-none text-base italic leading-relaxed placeholder:text-muted-foreground/50"
              rows={1}
            />
          </div>
        );

      case 'code':
        return (
          <div className="font-mono text-sm bg-muted/50 rounded-lg p-4 border border-border/50">
            <textarea
              ref={textareaRef}
              value={content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const newValue = content.text?.slice(0, start) + '  ' + content.text?.slice(end);
                  handleTextChange(newValue || '');
                } else {
                  handleKeyDown(e);
                }
              }}
              onFocus={() => { setIsEditing(true); onFocus?.(); }}
              onBlur={() => setIsEditing(false)}
              placeholder="// Code"
              className="w-full bg-transparent resize-none outline-none leading-relaxed placeholder:text-muted-foreground/50"
              rows={3}
            />
          </div>
        );

      case 'image':
        return content.imageUrl ? (
          <div className="rounded-lg overflow-hidden">
            <img
              src={content.imageUrl}
              alt={content.caption || 'Image'}
              className="w-full h-auto"
            />
            {content.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">{content.caption}</p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">Add an image</p>
          </div>
        );

      default:
        return (
          <textarea
            ref={textareaRef}
            value={content.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsEditing(true); onFocus?.(); }}
            onBlur={() => setIsEditing(false)}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/50"
            rows={1}
          />
        );
    }
  };

  return (
    <>
      <div
        ref={contentRef}
        className={cn(
          'group relative flex items-start gap-1 py-1 rounded-md transition-colors',
          isSelected && 'bg-primary/5',
          isHovered && 'bg-muted/30'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left controls */}
        <div
          className={cn(
            'flex items-center gap-0.5 pt-1 opacity-0 transition-opacity',
            isHovered && 'opacity-100'
          )}
        >
          <button
            onClick={() => {
              const rect = contentRef.current?.getBoundingClientRect();
              if (rect) {
                setMenuPosition({ x: rect.left, y: rect.top + 30 });
                setShowMenu(true);
              }
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted cursor-grab">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0">
          {renderBlockContent()}
        </div>

        {/* Right menu */}
        <div
          className={cn(
            'opacity-0 transition-opacity',
            isHovered && 'opacity-100'
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Slash command menu */}
      <BlockMenu
        isOpen={showMenu}
        position={menuPosition}
        filter={slashFilter}
        onSelect={handleBlockTypeSelect}
        onClose={() => {
          setShowMenu(false);
          setSlashFilter('');
        }}
      />
    </>
  );
};
