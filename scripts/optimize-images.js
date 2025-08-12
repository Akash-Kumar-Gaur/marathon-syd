const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Create optimized directory if it doesn't exist
const optimizedDir = path.join(__dirname, "../src/assets/images/optimized");
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Function to get all image files from assets directory
function getAllImageFiles() {
  const assetsDir = path.join(__dirname, "../src/assets/images");
  const imageFiles = [];

  try {
    const files = fs.readdirSync(assetsDir);
    files.forEach((file) => {
      const filePath = path.join(assetsDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(file)) {
        imageFiles.push(file);
      }
    });
  } catch (error) {
    console.error("Error reading assets directory:", error.message);
  }

  return imageFiles;
}

// Function to determine optimal settings for each image
function getOptimizationSettings(filename, originalSize) {
  const sizeMB = originalSize / (1024 * 1024);

  // Different optimization strategies based on file size and type
  if (sizeMB > 5) {
    // Very large files - aggressive optimization
    return { quality: 75, width: 1200, format: "png" };
  } else if (sizeMB > 1) {
    // Large files - moderate optimization
    return { quality: 80, width: 1000, format: "png" };
  } else if (sizeMB > 0.5) {
    // Medium files - light optimization
    return { quality: 85, width: 800, format: "png" };
  } else if (sizeMB > 0.1) {
    // Small files - minimal optimization
    return { quality: 90, width: 600, format: "png" };
  } else {
    // Very small files - just compress
    return { quality: 95, width: null, format: "png" };
  }
}

// Function to optimize a single image
async function optimizeImage(filename) {
  try {
    const inputPath = path.join(__dirname, "../src/assets/images", filename);
    const outputPath = path.join(optimizedDir, filename);

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);

    console.log(`Optimizing ${filename} (${originalSizeMB}MB)...`);

    // Get optimization settings
    const settings = getOptimizationSettings(filename, originalStats.size);

    let sharpInstance = sharp(inputPath);

    // Apply resizing if width is specified
    if (settings.width) {
      sharpInstance = sharpInstance.resize(settings.width, null, {
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimization
    if (settings.format === "png") {
      sharpInstance = sharpInstance.png({
        quality: settings.quality,
        compressionLevel: 9, // Maximum compression
        adaptiveFiltering: true,
        palette: true,
      });
    } else if (settings.format === "jpg" || settings.format === "jpeg") {
      sharpInstance = sharpInstance.jpeg({
        quality: settings.quality,
        progressive: true,
        mozjpeg: true,
      });
    } else if (settings.format === "webp") {
      sharpInstance = sharpInstance.webp({
        quality: settings.quality,
        effort: 6, // Maximum compression effort
      });
    }

    await sharpInstance.toFile(outputPath);

    // Get optimized file size
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);
    const savings = (
      ((originalStats.size - optimizedStats.size) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(
      `✅ ${filename}: ${originalSizeMB}MB → ${optimizedSizeMB}MB (${savings}% reduction)`
    );

    return {
      filename,
      original: originalSizeMB,
      optimized: optimizedSizeMB,
      savings: savings,
      settings: settings,
    };
  } catch (error) {
    console.error(`❌ Error optimizing ${filename}:`, error.message);
    return null;
  }
}

// Main optimization function
async function optimizeAllImages() {
  console.log("🚀 Starting comprehensive image optimization...\n");

  // Get all image files
  const imageFiles = getAllImageFiles();

  if (imageFiles.length === 0) {
    console.log("❌ No image files found in assets directory");
    return;
  }

  console.log(`📁 Found ${imageFiles.length} images to optimize:\n`);

  const results = [];
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  // Process images in parallel for better performance
  const optimizationPromises = imageFiles.map((filename) =>
    optimizeImage(filename)
  );
  const optimizationResults = await Promise.all(optimizationPromises);

  // Process results
  optimizationResults.forEach((result) => {
    if (result) {
      results.push(result);
      totalOriginalSize += parseFloat(result.original);
      totalOptimizedSize += parseFloat(result.optimized);
    }
  });

  // Display summary
  console.log("\n📊 Optimization Summary:");
  console.log("─".repeat(80));
  console.log(`Total images processed: ${results.length}`);
  console.log(`Total original size: ${totalOriginalSize.toFixed(2)}MB`);
  console.log(`Total optimized size: ${totalOptimizedSize.toFixed(2)}MB`);
  console.log(
    `Total savings: ${(
      ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
      100
    ).toFixed(1)}%`
  );
  console.log(
    `Average savings per image: ${(
      results.reduce((sum, r) => sum + parseFloat(r.savings), 0) /
      results.length
    ).toFixed(1)}%`
  );

  // Show top performers
  const topPerformers = results
    .sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings))
    .slice(0, 5);

  if (topPerformers.length > 0) {
    console.log("\n🏆 Top Performance Improvements:");
    topPerformers.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.filename}: ${result.savings}% reduction`
      );
    });
  }

  console.log(`\n✨ Optimized images saved to: ${optimizedDir}`);
  console.log("\n💡 Next steps:");
  console.log("  1. Run: npm run update-imports");
  console.log("  2. Test: npm run build:fast:bib");
  console.log("  3. Analyze: npm run analyze-bundle");
}

// Run optimization
optimizeAllImages().catch(console.error);
