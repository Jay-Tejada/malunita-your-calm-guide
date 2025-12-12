import { useState, useEffect, useRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Minus,
  MessageSquare,
  Quote,
  Code,
} from 'lucide-react';
import { BlockType, SlashCommand } from '../types';
import { cn } from '@/lib/utils';

interface BlockMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (blockType: BlockType) => void;
  onClose: () => void;
  filter?: string;
}

const commands: SlashCommand[] = [
  { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, blockType: 'text', description: 'Just start writing with plain text' },
  { id: 'heading1', label: 'Heading 1', icon: <Heading1 className="w-4 h-4" />, blockType: 'heading1', description: 'Big section heading' },
  { id: 'heading2', label: 'Heading 2', icon: <Heading2 className="w-4 h-4" />, blockType: 'heading2', description: 'Medium section heading' },
  { id: 'heading3', label: 'Heading 3', icon: <Heading3 className="w-4 h-4" />, blockType: 'heading3', description: 'Small section heading' },
  { id: 'list', label: 'Bulleted list', icon: <List className="w-4 h-4" />, blockType: 'list', description: 'Create a simple bulleted list' },
  { id: 'numbered', label: 'Numbered list', icon: <ListOrdered className="w-4 h-4" />, blockType: 'numbered_list', description: 'Create a list with numbering' },
  { id: 'checklist', label: 'To-do list', icon: <CheckSquare className="w-4 h-4" />, blockType: 'checklist', description: 'Track tasks with a to-do list' },
  { id: 'image', label: 'Image', icon: <Image className="w-4 h-4" />, blockType: 'image', description: 'Upload or embed an image' },
  { id: 'divider', label: 'Divider', icon: <Minus className="w-4 h-4" />, blockType: 'divider', description: 'Visually divide blocks' },
  { id: 'callout', label: 'Callout', icon: <MessageSquare className="w-4 h-4" />, blockType: 'callout', description: 'Make writing stand out' },
  { id: 'quote', label: 'Quote', icon: <Quote className="w-4 h-4" />, blockType: 'quote', description: 'Capture a quote' },
  { id: 'code', label: 'Code', icon: <Code className="w-4 h-4" />, blockType: 'code', description: 'Capture a code snippet' },
];

export const BlockMenu = ({
  isOpen,
  position,
  onSelect,
  onClose,
  filter = '',
}: BlockMenuProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(
    cmd =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].blockType);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-background border border-border rounded-lg shadow-lg animate-[scale-in_0.15s_ease-out]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="p-2">
        <p className="text-xs text-muted-foreground px-2 py-1">Basic blocks</p>
        {filteredCommands.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            No results
          </p>
        ) : (
          filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.blockType)}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                index === selectedIndex
                  ? 'bg-muted'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-muted border border-border/50">
                {cmd.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{cmd.label}</p>
                <p className="text-xs text-muted-foreground">{cmd.description}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
