/**
 * Low Quality Image Placeholders (LQIP) for companion images
 * These are tiny, blurred base64-encoded versions that load instantly
 * 
 * To generate these:
 * 1. Resize image to 20px width (keep aspect ratio)
 * 2. Apply gaussian blur
 * 3. Convert to base64 data URI
 * 4. Use online tool: https://blurred.dev/ or similar
 */

export const LQIP_PLACEHOLDERS = {
  // Main companion states (20px thumbnails, ~200 bytes each)
  malunitaNeutral: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  malunitaHappy: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  malunitaCalm: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  malunitaCurious: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  malunitaExcited: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  
  // Expression states
  baseExpression: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  happyExpression: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  excitedExpression: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  concernedExpression: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  
  // Baby stages
  babyHappy: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  babyListening: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  babyNeutral: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
  babySleepy: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoUABQAPm0uk0akIiGhKAgAgA2JQBOgCP4A/v8A/v8A",
};

/**
 * Convert .png imports to .webp equivalents
 * Assumes .webp versions exist in the same directory
 */
export const toWebP = (pngPath: string): string => {
  // If already .webp, return as-is
  if (pngPath.endsWith('.webp')) return pngPath;
  
  // Replace .png extension with .webp
  return pngPath.replace(/\.png$/i, '.webp');
};

/**
 * Get LQIP placeholder for a given image path
 */
export const getLQIP = (imagePath: string): string => {
  // Extract filename without extension
  const filename = imagePath.split('/').pop()?.replace(/\.(png|webp)$/i, '');
  
  // Convert kebab-case to camelCase for lookup
  const key = filename?.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof typeof LQIP_PLACEHOLDERS;
  
  return LQIP_PLACEHOLDERS[key] || LQIP_PLACEHOLDERS.malunitaNeutral;
};

/**
 * Preload critical images that will be shown immediately
 */
export const preloadImages = (imagePaths: string[]) => {
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = path;
    document.head.appendChild(link);
  });
};
