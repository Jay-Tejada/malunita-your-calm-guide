# Image Optimization Guide

## Current Status
✅ Lazy loading implemented with LQIP (Low Quality Image Placeholders)  
✅ Async decoding enabled  
✅ Preloading for critical companion images  
⏳ PNG to WebP conversion needed (see steps below)

## How to Convert PNG to WebP

### Option 1: Using Squoosh (Recommended for Manual Conversion)
1. Go to https://squoosh.app/
2. Drag and drop each PNG from `src/assets/companions/`
3. Select WebP format in the right panel
4. Adjust quality to 80-85 (good balance of quality/size)
5. Download and replace the original files

### Option 2: Using ImageMin CLI (Batch Conversion)
```bash
# Install imagemin
npm install -g imagemin-cli imagemin-webp

# Convert all PNGs to WebP
imagemin src/assets/companions/*.png --out-dir=src/assets/companions --plugin=webp
```

### Option 3: Using Sharp (Node.js Script)
Create `convert-images.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './src/assets/companions';
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));

files.forEach(async (file) => {
  const input = path.join(inputDir, file);
  const output = path.join(inputDir, file.replace('.png', '.webp'));
  
  await sharp(input)
    .webp({ quality: 85 })
    .toFile(output);
  
  console.log(`Converted ${file} → ${output}`);
});
```

Run: `node convert-images.js`

## After Conversion

1. Update imports in `src/lib/companionAssets.ts`:
   - Change all `.png` to `.webp`
   - Example: `import malunitaNeutral from '@/assets/companions/malunita-neutral.webp';`

2. Update LQIP placeholders in `src/lib/imageOptimization.ts`:
   - Generate tiny 20px wide versions of each WebP
   - Convert to base64: `data:image/webp;base64,...`
   - Use https://blurred.dev/ or similar tool

3. Test thoroughly:
   - Check all companion expressions load correctly
   - Verify mobile performance improvements
   - Confirm LQIP placeholders appear while loading

## Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total image size | ~6MB | ~2MB | 67% reduction |
| Initial load time | 3-4s | 1-1.5s | 60% faster |
| Mobile data usage | High | Low | 4MB saved |
| Time to interactive | Slower | Faster | Better UX |

## Files Already Optimized

The following components now use lazy loading + LQIP:
- ✅ `CompanionVisual.tsx`
- ✅ `CreatureSprite.tsx`
- ✅ `CompanionExpression.tsx`
- ✅ `OptimizedImage.tsx` (new utility component)

## Notes

- Keep original PNGs as backup during development
- WebP has 95%+ browser support (all modern browsers)
- Quality 80-85 is ideal for companion images
- LQIP adds ~200 bytes per image but loads instantly
