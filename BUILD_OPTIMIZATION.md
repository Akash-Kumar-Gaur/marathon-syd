# Build Optimization Guide

## 🚀 Image Optimization

### Results
- **Total image size reduction**: 43.96MB → 2.96MB (**93.3% reduction**)
- **Individual image optimizations**:
  - `bibForm.png`: 15.51MB → 0.35MB (97.8% reduction)
  - `formBg.png`: 17.41MB → 0.48MB (97.3% reduction)
  - `slide1.png`: 2.59MB → 0.17MB (93.3% reduction)
  - `slide2.png`: 1.30MB → 0.33MB (74.9% reduction)
  - `slide3.png`: 1.07MB → 0.29MB (73.2% reduction)
  - `startBg.png`: 2.93MB → 0.80MB (72.6% reduction)
  - `staticMap.png`: 1.52MB → 0.40MB (73.4% reduction)
  - `troubleOtp.png`: 1.63MB → 0.14MB (91.5% reduction)

### How to Use
```bash
# Optimize images (run once after adding new large images)
npm run optimize-images

# Update import paths to use optimized images
npm run update-imports

# Analyze bundle sizes
npm run analyze-bundle
```

## ⚡ Fast Build Options

### Available Scripts
```bash
# Standard builds
npm run build              # Default build
npm run build:default      # Default flow build
npm run build:bib          # Bib route build

# Fast builds (no source maps)
npm run build:fast         # Fast default build
npm run build:fast:bib     # Fast bib route build

# Optimized builds (with webpack optimizations)
npm run build:optimized    # Optimized default build
npm run build:optimized:bib # Optimized bib route build
```

### Performance Benefits
- **Source maps disabled**: Reduces build time and bundle size
- **Optimized images**: Significantly smaller bundle size
- **Webpack optimizations**: Better tree shaking and chunk splitting
- **Gzip compression**: Automatic compression for production
- **Faster deployment**: Smaller files upload faster

## 🔧 Webpack Optimizations

### What's Optimized
- **Tree shaking**: Better removal of unused code
- **Chunk splitting**: Separate vendor and common chunks
- **CSS optimization**: Disabled source maps for CSS
- **Terser optimization**: Remove console.log in production
- **Gzip compression**: Automatic compression for static assets

### Configuration
- Uses `react-app-rewired` for custom webpack config
- `config-overrides.js` contains all optimizations
- Automatic vendor chunk separation
- Production-specific optimizations

## 🎯 Bib Route Optimization

### What's Optimized
- **UserContext removed**: No authentication overhead for bib route
- **Simplified routing**: Only necessary routes enabled
- **Reduced dependencies**: Firebase and user management not loaded
- **Faster startup**: No user authentication checks

### Environment Configuration
```bash
# Set environment for bib route
REACT_APP_FLOW_TYPE=bib_route

# Or use the convenience script
npm run build:optimized:bib
```

## 📦 Bundle Analysis

### Current Bundle Sizes (after optimization)
- **Main JS**: 1.01 MB (down from 1.27 MB)
- **Vendors chunk**: 747.05 kB (new chunk for better caching)
- **CSS**: 21.38 kB (down from 47.54 kB)
- **Total bundle**: Significantly reduced due to image optimization

### Bundle Analysis Tool
```bash
# Analyze current build
npm run analyze-bundle

# This will show:
# - File sizes sorted by size
# - Large file identification
# - Optimization recommendations
# - Total bundle size
```

## 🛠️ Development Workflow

### For Bib Route Development
```bash
# Start development server
npm run start:bib

# Build for production
npm run build:optimized:bib

# Deploy optimized build
npm run build:optimized:bib && firebase deploy
```

### For Default Flow Development
```bash
# Start development server
npm run start:default

# Build for production
npm run build:optimized

# Deploy optimized build
npm run build:optimized && firebase deploy
```

## 📊 Monitoring Build Performance

### Track Build Times
```bash
# Time your builds
time npm run build:optimized:bib
time npm run build:optimized
```

### Bundle Size Monitoring
- Use `npm run analyze-bundle` after each build
- Check for regressions when adding new dependencies
- Monitor image sizes when adding new assets

## 🔧 Advanced Optimizations

### Code Splitting
```javascript
// Example: Lazy load components
const Wayfinder = React.lazy(() => import('./pages/WayfinderMapbox'));
const FindMyRoute = React.lazy(() => import('./pages/FindMyRoute'));
```

### Tree Shaking
- Use ES6 imports instead of CommonJS
- Avoid importing entire libraries when possible
- Use specific imports: `import { Button } from '@mui/material'`

### Service Worker
- Implement PWA features for caching
- Reduce network requests for static assets
- Improve offline experience

## 📈 Performance Metrics

### Before Optimization
- **Total image size**: 43.96MB
- **Build time**: ~60-90 seconds
- **Bundle size**: Large due to uncompressed images
- **No webpack optimizations**

### After Optimization
- **Total image size**: 2.96MB (**93.3% reduction**)
- **Build time**: ~40-50 seconds (**25-40% faster**)
- **Bundle size**: Significantly reduced
- **Webpack optimizations enabled**
- **Deployment speed**: Much faster

## 🚨 Troubleshooting

### Common Issues
1. **Image not found**: Run `npm run update-imports` after optimization
2. **Build errors**: Check that all optimized images exist
3. **Performance regression**: Verify image optimization was successful
4. **Webpack errors**: Ensure `react-app-rewired` is properly configured

### Rollback
```bash
# If optimization causes issues, restore original images
git checkout HEAD -- src/assets/images/
git checkout HEAD -- src/pages/
```

## 📚 Additional Resources

- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [Webpack Bundle Analysis](https://webpack.js.org/guides/code-splitting/)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [React App Rewired](https://github.com/timarney/react-app-rewired)
