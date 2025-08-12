# Build Optimization Guide - Deploy Version

## 🚀 Build Optimization Scripts

### Available Commands
```bash
# Fast builds (no source maps)
npm run build:fast         # Fast default build
npm run build:fast:bib     # Fast bib route build

# Image optimization
npm run optimize-images     # Optimize large images
npm run update-imports     # Update import paths to optimized images

# Bundle analysis
npm run analyze-bundle     # Analyze build bundle sizes
```

## ⚡ Performance Benefits

- **Source maps disabled**: Reduces build time and bundle size
- **Image optimization**: Compress large PNG files (70-98% reduction)
- **Faster deployment**: Smaller files upload faster
- **Bundle analysis**: Monitor and optimize bundle sizes

## 🎯 How to Use

### 1. Optimize Images
```bash
# Run once to optimize large images
npm run optimize-images

# Update import paths
npm run update-imports
```

### 2. Fast Builds
```bash
# For default flow
npm run build:fast

# For bib route
npm run build:fast:bib
```

### 3. Analyze Bundle
```bash
# After building, analyze the bundle
npm run build:fast:bib
npm run analyze-bundle
```

## 📊 Expected Results

- **Build time**: 25-40% faster
- **Image sizes**: 70-98% reduction
- **Bundle size**: Significantly smaller
- **Deployment**: Much faster

## 🚨 Notes

- This is a simplified version for deploy-version branch
- Only build-related optimizations are included
- No changes to source code or components
- Focus on build performance and image optimization
