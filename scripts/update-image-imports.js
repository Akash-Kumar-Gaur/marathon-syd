const fs = require("fs");
const path = require("path");

// Function to get all optimized images
function getOptimizedImages() {
  const optimizedDir = path.join(__dirname, "../src/assets/images/optimized");

  if (!fs.existsSync(optimizedDir)) {
    console.log(
      "❌ Optimized images directory not found. Run npm run optimize-images first."
    );
    return [];
  }

  try {
    const files = fs.readdirSync(optimizedDir);
    return files.filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file));
  } catch (error) {
    console.error("Error reading optimized images directory:", error.message);
    return [];
  }
}

// Function to update import paths in a file
function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let hasChanges = false;

    const optimizedImages = getOptimizedImages();

    optimizedImages.forEach((imageName) => {
      // Handle different import patterns
      const importPatterns = [
        `from "../assets/images/${imageName}"`,
        `from "../assets/images/${imageName}"`,
        `from "./assets/images/${imageName}"`,
        `from "./assets/images/${imageName}"`,
        `from "../../assets/images/${imageName}"`,
        `from "../../assets/images/${imageName}"`,
        `from "../../../assets/images/${imageName}"`,
        `from "../../../assets/images/${imageName}"`,
      ];

      importPatterns.forEach((pattern) => {
        if (content.includes(pattern)) {
          const newImport = pattern.replace(
            "/assets/images/",
            "/assets/images/optimized/"
          );
          content = content.replace(pattern, newImport);
          hasChanges = true;
          console.log(`✅ Updated ${imageName} import in ${filePath}`);
        }
      });
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and update all JS/JSX files
function updateAllFiles(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== "build" &&
      file !== "scripts" &&
      file !== "optimized"
    ) {
      updatedCount += updateAllFiles(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
      if (updateFileImports(filePath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

// Main execution
console.log("🔄 Updating image import paths to use optimized versions...\n");

// Get optimized images first
const optimizedImages = getOptimizedImages();

if (optimizedImages.length === 0) {
  console.log(
    "❌ No optimized images found. Run npm run optimize-images first."
  );
  process.exit(1);
}

console.log(`📁 Found ${optimizedImages.length} optimized images to update:\n`);
optimizedImages.forEach((image, index) => {
  console.log(`  ${index + 1}. ${image}`);
});

console.log("\n🔄 Updating import paths...\n");

const srcDir = path.join(__dirname, "../src");
const updatedCount = updateAllFiles(srcDir);

console.log(`\n✨ Updated ${updatedCount} files with optimized image imports!`);
console.log("\n💡 Next steps:");
console.log("  1. Test the build: npm run build:fast:bib");
console.log("  2. Analyze bundle: npm run analyze-bundle");
console.log("  3. Deploy: npm run deploy:wayfinder");
