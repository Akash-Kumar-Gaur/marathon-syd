const fs = require("fs");
const path = require("path");

// Function to get file size in human readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Function to analyze build directory
function analyzeBuild() {
  const buildDir = path.join(__dirname, "../build");

  if (!fs.existsSync(buildDir)) {
    console.log("❌ Build directory not found. Run npm run build first.");
    return;
  }

  console.log("📊 Analyzing build bundle...\n");

  // Analyze static files
  const staticDir = path.join(buildDir, "static");
  let totalSize = 0;
  const fileAnalysis = [];

  if (fs.existsSync(staticDir)) {
    const analyzeDirectory = (dir, prefix = "") => {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          analyzeDirectory(itemPath, prefix + "  ");
        } else {
          const relativePath = path.relative(buildDir, itemPath);
          const size = stat.size;
          totalSize += size;

          fileAnalysis.push({
            path: relativePath,
            size: size,
            formattedSize: formatBytes(size),
          });
        }
      });
    };

    analyzeDirectory(staticDir);
  }

  // Sort by size (largest first)
  fileAnalysis.sort((a, b) => b.size - a.size);

  // Display results
  console.log("📁 File Analysis (sorted by size):");
  console.log("─".repeat(60));

  fileAnalysis.forEach((file) => {
    console.log(`${file.formattedSize.padEnd(10)} ${file.path}`);
  });

  console.log("─".repeat(60));
  console.log(`📦 Total Bundle Size: ${formatBytes(totalSize)}`);

  // Identify large files
  const largeFiles = fileAnalysis.filter((file) => file.size > 100 * 1024); // > 100KB

  if (largeFiles.length > 0) {
    console.log("\n🚨 Large Files (>100KB):");
    largeFiles.forEach((file) => {
      console.log(`  • ${file.path}: ${file.formattedSize}`);
    });
  }

  // Recommendations
  console.log("\n💡 Optimization Recommendations:");

  if (totalSize > 5 * 1024 * 1024) {
    // > 5MB
    console.log("  • Bundle is large - consider code splitting");
    console.log("  • Review and remove unused dependencies");
    console.log("  • Implement lazy loading for routes");
  }

  const jsFiles = fileAnalysis.filter((file) => file.path.endsWith(".js"));
  const cssFiles = fileAnalysis.filter((file) => file.path.endsWith(".css"));

  if (jsFiles.length > 3) {
    console.log("  • Multiple JS chunks detected - consider consolidating");
  }

  if (cssFiles.length > 1) {
    console.log("  • Multiple CSS files - consider CSS optimization");
  }

  // Check for source maps
  const sourceMaps = fileAnalysis.filter((file) => file.path.endsWith(".map"));
  if (sourceMaps.length > 0) {
    console.log(
      "  • Source maps found - use GENERATE_SOURCEMAP=false for production"
    );
  }

  console.log(
    "\n✨ Use npm run build:fast for faster builds without source maps"
  );
}

// Run analysis
analyzeBuild();
