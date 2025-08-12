const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Create optimized directory if it doesn't exist
const optimizedDir = path.join(__dirname, "../src/assets/images/optimized");
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// List of images to optimize with their target sizes and quality settings
const imagesToOptimize = [
  // Already optimized images (will be skipped)
  {
    input: "src/assets/images/bibForm.png",
    output: "src/assets/images/optimized/bibForm.png",
    quality: 80,
    width: 1200,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/formBg.png",
    output: "src/assets/images/optimized/formBg.png",
    quality: 80,
    width: 1200,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/slide1.png",
    output: "src/assets/images/optimized/slide1.png",
    quality: 85,
    width: 800,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/slide2.png",
    output: "src/assets/images/optimized/slide2.png",
    quality: 85,
    width: 800,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/slide3.png",
    output: "src/assets/images/optimized/slide3.png",
    quality: 85,
    width: 800,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/startBg.png",
    output: "src/assets/images/optimized/startBg.png",
    quality: 80,
    width: 1200,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/staticMap.png",
    output: "src/assets/images/optimized/staticMap.png",
    quality: 85,
    width: 1000,
    skipIfExists: true,
  },
  {
    input: "src/assets/images/troubleOtp.png",
    output: "src/assets/images/optimized/troubleOtp.png",
    quality: 85,
    width: 800,
    skipIfExists: true,
  },

  // New images to optimize
  {
    input: "src/assets/images/limeBike.png",
    output: "src/assets/images/optimized/limeBike.png",
    quality: 85,
    width: 1200,
  },
  {
    input: "src/assets/images/prize.png",
    output: "src/assets/images/optimized/prize.png",
    quality: 90,
    width: 800,
  },
  {
    input: "src/assets/images/static.png",
    output: "src/assets/images/optimized/static.png",
    quality: 85,
    width: 1000,
  },
  {
    input: "src/assets/images/puzzle.png",
    output: "src/assets/images/optimized/puzzle.png",
    quality: 90,
    width: 1000,
  },
  {
    input: "src/assets/images/boost.png",
    output: "src/assets/images/optimized/boost.png",
    quality: 90,
    width: 800,
  },
  {
    input: "src/assets/images/treasure1.png",
    output: "src/assets/images/optimized/treasure1.png",
    quality: 90,
    width: 600,
  },
  {
    input: "src/assets/images/treasureIcon.png",
    output: "src/assets/images/optimized/treasureIcon.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/syd-tcs-logo.png",
    output: "src/assets/images/optimized/syd-tcs-logo.png",
    quality: 95,
    width: 400,
  },
  {
    input: "src/assets/images/hintBG.png",
    output: "src/assets/images/optimized/hintBG.png",
    quality: 90,
    width: 600,
  },
  {
    input: "src/assets/images/hintIcon.png",
    output: "src/assets/images/optimized/hintIcon.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/marker.png",
    output: "src/assets/images/optimized/marker.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/puzzleTile.png",
    output: "src/assets/images/optimized/puzzleTile.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/matchTile.png",
    output: "src/assets/images/optimized/matchTile.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/trivia.png",
    output: "src/assets/images/optimized/trivia.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/mascot.png",
    output: "src/assets/images/optimized/mascot.png",
    quality: 90,
    width: 600,
  },
  {
    input: "src/assets/images/pointsBg.png",
    output: "src/assets/images/optimized/pointsBg.png",
    quality: 90,
    width: 400,
  },
  {
    input: "src/assets/images/bottle.png",
    output: "src/assets/images/optimized/bottle.png",
    quality: 90,
    width: 200,
  },
  {
    input: "src/assets/images/boy.png",
    output: "src/assets/images/optimized/boy.png",
    quality: 90,
    width: 200,
  },
  {
    input: "src/assets/images/shoe.png",
    output: "src/assets/images/optimized/shoe.png",
    quality: 90,
    width: 200,
  },
  {
    input: "src/assets/images/shokz.png",
    output: "src/assets/images/optimized/shokz.png",
    quality: 90,
    width: 200,
  },
  {
    input: "src/assets/images/flipPlace.png",
    output: "src/assets/images/optimized/flipPlace.png",
    quality: 90,
    width: 200,
  },
];

async function optimizeImage(config) {
  try {
    const inputPath = path.resolve(__dirname, "..", config.input);
    const outputPath = path.resolve(__dirname, "..", config.output);

    // Check if output already exists and should be skipped
    if (config.skipIfExists && fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${config.input} (already optimized)`);
      return null;
    }

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.log(
        `⚠️  Warning: Input file ${config.input} not found, skipping...`
      );
      return null;
    }

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(1);

    console.log(`Optimizing ${config.input} (${originalSizeKB}KB)...`);

    await sharp(inputPath)
      .resize(config.width, null, { withoutEnlargement: true })
      .png({ quality: config.quality })
      .toFile(outputPath);

    // Get optimized file size
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSizeKB = (optimizedStats.size / 1024).toFixed(1);
    const savings = (
      ((originalStats.size - optimizedStats.size) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(
      `✅ ${config.input}: ${originalSizeKB}KB → ${optimizedSizeKB}KB (${savings}% reduction)`
    );

    return {
      original: originalSizeKB,
      optimized: optimizedSizeKB,
      savings: savings,
    };
  } catch (error) {
    console.error(`❌ Error optimizing ${config.input}:`, error.message);
    return null;
  }
}

async function optimizeAllImages() {
  console.log("🚀 Starting comprehensive image optimization...\n");

  const results = [];
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let skippedCount = 0;

  for (const config of imagesToOptimize) {
    const result = await optimizeImage(config);
    if (result === null && config.skipIfExists) {
      skippedCount++;
    } else if (result) {
      results.push(result);
      totalOriginalSize += parseFloat(result.original);
      totalOptimizedSize += parseFloat(result.optimized);
    }
  }

  console.log("\n📊 Optimization Summary:");
  console.log(`Total original size: ${totalOriginalSize.toFixed(1)}KB`);
  console.log(`Total optimized size: ${totalOptimizedSize.toFixed(1)}KB`);
  console.log(
    `Total savings: ${(
      ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
      100
    ).toFixed(1)}%`
  );
  console.log(`Images optimized: ${results.length}`);
  console.log(`Images skipped: ${skippedCount}`);
  console.log(`\n✨ Optimized images saved to: ${optimizedDir}`);
  console.log(
    '\n💡 Next step: Run "npm run update-imports" to update import paths.'
  );
}

optimizeAllImages().catch(console.error);
