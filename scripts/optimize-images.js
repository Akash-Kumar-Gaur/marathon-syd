const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Create optimized directory if it doesn't exist
const optimizedDir = path.join(__dirname, "../src/assets/images/optimized");
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// List of images to optimize with their target sizes
const imagesToOptimize = [
  {
    input: "src/assets/images/bibForm.png",
    output: "src/assets/images/optimized/bibForm.png",
    quality: 80,
    width: 1200, // Reduce from 16MB
  },
  {
    input: "src/assets/images/formBg.png",
    output: "src/assets/images/optimized/formBg.png",
    quality: 80,
    width: 1200, // Reduce from 17MB
  },
  {
    input: "src/assets/images/slide1.png",
    output: "src/assets/images/optimized/slide1.png",
    quality: 85,
    width: 800, // Reduce from 2.6MB
  },
  {
    input: "src/assets/images/slide2.png",
    output: "src/assets/images/optimized/slide2.png",
    quality: 85,
    width: 800, // Reduce from 1.3MB
  },
  {
    input: "src/assets/images/slide3.png",
    output: "src/assets/images/optimized/slide3.png",
    quality: 85,
    width: 800, // Reduce from 1.1MB
  },
  {
    input: "src/assets/images/startBg.png",
    output: "src/assets/images/optimized/startBg.png",
    quality: 80,
    width: 1200, // Reduce from 2.9MB
  },
  {
    input: "src/assets/images/staticMap.png",
    output: "src/assets/images/optimized/staticMap.png",
    quality: 85,
    width: 1000, // Reduce from 1.5MB
  },
  {
    input: "src/assets/images/troubleOtp.png",
    output: "src/assets/images/optimized/troubleOtp.png",
    quality: 85,
    width: 800, // Reduce from 1.6MB
  },
];

async function optimizeImage(config) {
  try {
    const inputPath = path.resolve(__dirname, "..", config.input);
    const outputPath = path.resolve(__dirname, "..", config.output);

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);

    console.log(`Optimizing ${config.input} (${originalSizeMB}MB)...`);

    await sharp(inputPath)
      .resize(config.width, null, { withoutEnlargement: true })
      .png({ quality: config.quality })
      .toFile(outputPath);

    // Get optimized file size
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);
    const savings = (
      ((originalStats.size - optimizedStats.size) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(
      `✅ ${config.input}: ${originalSizeMB}MB → ${optimizedSizeMB}MB (${savings}% reduction)`
    );

    return {
      original: originalSizeMB,
      optimized: optimizedSizeMB,
      savings: savings,
    };
  } catch (error) {
    console.error(`❌ Error optimizing ${config.input}:`, error.message);
    return null;
  }
}

async function optimizeAllImages() {
  console.log("🚀 Starting image optimization...\n");

  const results = [];
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const config of imagesToOptimize) {
    const result = await optimizeImage(config);
    if (result) {
      results.push(result);
      totalOriginalSize += parseFloat(result.original);
      totalOptimizedSize += parseFloat(result.optimized);
    }
  }

  console.log("\n📊 Optimization Summary:");
  console.log(`Total original size: ${totalOriginalSize.toFixed(2)}MB`);
  console.log(`Total optimized size: ${totalOptimizedSize.toFixed(2)}MB`);
  console.log(
    `Total savings: ${(
      ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
      100
    ).toFixed(1)}%`
  );
  console.log(`\n✨ Optimized images saved to: ${optimizedDir}`);
  console.log(
    "\n💡 To use optimized images, update your import paths to point to the optimized versions."
  );
}

optimizeAllImages().catch(console.error);
