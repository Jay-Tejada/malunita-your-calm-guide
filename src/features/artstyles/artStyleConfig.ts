export type ArtStyleKey = 'storybook' | 'sketch' | 'watercolor' | 'pixel' | 'minimal-mono';

export interface ArtStyle {
  id: ArtStyleKey;
  name: string;
  description: string;
  icon: string;
  assetPathPattern: string; // Pattern with {expression} placeholder
  cssFilter?: string; // Optional CSS filter for style effects
  previewImage?: string;
}

export const ART_STYLES: Record<ArtStyleKey, ArtStyle> = {
  'storybook': {
    id: 'storybook',
    name: 'Storybook',
    description: 'Classic illustrated style',
    icon: '📖',
    assetPathPattern: '/src/assets/companions/{expression}.png',
    previewImage: '/src/assets/companions/base_expression.png',
  },
  'sketch': {
    id: 'sketch',
    name: 'Sketch',
    description: 'Hand-drawn pencil lines',
    icon: '✏️',
    assetPathPattern: '/src/assets/companions/sketch/{expression}.png',
    cssFilter: 'grayscale(0.3) contrast(1.2)',
    previewImage: '/src/assets/companions/base_expression.png',
  },
  'watercolor': {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft painted washes',
    icon: '🎨',
    assetPathPattern: '/src/assets/companions/watercolor/{expression}.png',
    cssFilter: 'saturate(1.3) blur(0.3px)',
    previewImage: '/src/assets/companions/base_expression.png',
  },
  'pixel': {
    id: 'pixel',
    name: 'Pixel',
    description: 'Retro 16-bit aesthetic',
    icon: '🕹️',
    assetPathPattern: '/src/assets/companions/pixel/{expression}.png',
    cssFilter: 'contrast(1.1)',
    previewImage: '/src/assets/companions/base_expression.png',
  },
  'minimal-mono': {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Flat shapes and simple lines',
    icon: '⚫',
    assetPathPattern: '/src/assets/companions/minimal/{expression}.png',
    cssFilter: 'grayscale(0.8) contrast(1.3)',
    previewImage: '/src/assets/companions/base_expression.png',
  },
};

export const DEFAULT_ART_STYLE: ArtStyleKey = 'storybook';

// Helper to get asset path for a given style and expression
export const getStyleAssetPath = (
  style: ArtStyleKey,
  expression: string
): string => {
  const artStyle = ART_STYLES[style];
  return artStyle.assetPathPattern.replace('{expression}', expression);
};

// Helper to check if a style asset exists (for fallback logic)
export const getAssetWithFallback = (
  style: ArtStyleKey,
  expression: string
): { path: string; isFallback: boolean } => {
  const preferredPath = getStyleAssetPath(style, expression);
  
  // For now, always use storybook as fallback since other assets don't exist yet
  // In the future, you could add actual asset existence checks here
  if (style !== 'storybook') {
    // Try to use the styled asset, but mark as fallback since they don't exist yet
    return {
      path: getStyleAssetPath('storybook', expression),
      isFallback: true,
    };
  }
  
  return {
    path: preferredPath,
    isFallback: false,
  };
};
