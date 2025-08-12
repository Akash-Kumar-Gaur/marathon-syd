const fs = require('fs');
const path = require('path');

// List of images that have been optimized
const optimizedImages = [
  'bibForm.png',
  'formBg.png', 
  'slide1.png',
  'slide2.png',
  'slide3.png',
  'startBg.png',
  'staticMap.png',
  'troubleOtp.png'
];

// Function to update import paths in a file
function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    optimizedImages.forEach(imageName => {
      const oldImport = `from "../assets/images/${imageName}"`;
      const newImport = `from "../assets/images/optimized/${imageName}"`;
      
      if (content.includes(oldImport)) {
        content = content.replace(oldImport, newImport);
        hasChanges = true;
        console.log(`✅ Updated ${imageName} import in ${filePath}`);
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
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
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== 'scripts') {
      updatedCount += updateAllFiles(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (updateFileImports(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🔄 Updating image import paths to use optimized versions...\n');

const srcDir = path.join(__dirname, '../src');
const updatedCount = updateAllFiles(srcDir);

console.log(`\n✨ Updated ${updatedCount} files with optimized image imports!`);
console.log('\n💡 You can now run a fast build with: npm run build:fast');
console.log('💡 Or for bib route: npm run build:fast:bib');
