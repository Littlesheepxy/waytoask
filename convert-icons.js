const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const inputSvg = path.join(__dirname, 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'icons');

async function convertIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);
    
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Created ${size}x${size} icon: ${outputPath}`);
  }
}

convertIcons().catch(console.error); 