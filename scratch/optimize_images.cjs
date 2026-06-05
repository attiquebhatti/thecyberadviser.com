const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = [
  'public/images/blogs/quantum-computing/quantum-shield.png'
];

async function optimize() {
  for (const imgPath of images) {
    const fullPath = path.join(process.cwd(), imgPath);
    const tmpPath = fullPath + '.tmp';
    
    console.log(`Further optimizing ${imgPath}...`);
    
    // Resize to max 800 width and compress more
    await sharp(fullPath)
      .resize(800, null, { withoutEnlargement: true })
      .png({ quality: 60, compressionLevel: 9 })
      .toFile(tmpPath);

    fs.renameSync(tmpPath, fullPath);
    const newMetadata = await sharp(fullPath).metadata();
    console.log(`Optimized size: ${newMetadata.width}x${newMetadata.height}`);
    console.log(`Optimized file size: ${fs.statSync(fullPath).size} bytes`);
  }
}

optimize().catch(console.error);
