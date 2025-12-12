// Canvas Types

export interface CanvasProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectPage {
  id: string;
  project_id: string;
  parent_page_id?: string;
  user_id: string;
  title: string;
  page_type: 'canvas' | 'idea_board' | 'structured_doc' | 'gallery';
  icon: string;
  is_collapsed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: ProjectPage[];
}

export type BlockType = 
  | 'text' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3'
  | 'list' 
  | 'numbered_list'
  | 'checklist' 
  | 'image' 
  | 'divider' 
  | 'callout'
  | 'quote'
  | 'code';

export interface PageBlock {
  id: string;
  page_id: string;
  user_id: string;
  block_type: BlockType;
  content: BlockContent;
  sort_order: number;
  indent_level: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BlockContent {
  text?: string;
  checked?: boolean;
  items?: string[];
  imageUrl?: string;
  caption?: string;
  language?: string;
  calloutType?: 'info' | 'warning' | 'success' | 'error';
}

export interface GalleryItem {
  id: string;
  page_id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  tags: string[];
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface IdeaBoardItem {
  id: string;
  page_id: string;
  user_id: string;
  item_type: 'sticky' | 'image' | 'arrow' | 'highlight';
  content: IdeaBoardContent;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  z_index: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IdeaBoardContent {
  text?: string;
  imageUrl?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  curveType?: 'straight' | 'curved';
}

export interface SlashCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  blockType: BlockType;
  description: string;
}
