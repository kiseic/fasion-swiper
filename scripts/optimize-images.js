#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const CONFIG = {
  inputDir: './images',
  outputDir: './public/optimized-images',
  sizes: {
    small: { width: 80, quality: 85 },
    medium: { width: 276, quality: 90 },
    large: { width: 320, quality: 90 }
  }
};

async function optimizeImages() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Get all image files
  const files = fs.readdirSync(CONFIG.inputDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  console.log(`Found ${files.length} images to optimize`);

  for (const file of files) {
    const inputPath = path.join(CONFIG.inputDir, file);
    const baseName = path.basename(file, path.extname(file));
    
    // Process each size
    for (const [sizeName, sizeConfig] of Object.entries(CONFIG.sizes)) {
      const outputName = `${baseName}-${sizeName}.webp`;
      const outputPath = path.join(CONFIG.outputDir, outputName);
      
      try {
        await sharp(inputPath)
          .resize(sizeConfig.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: sizeConfig.quality })
          .toFile(outputPath);
          
        console.log(`✓ Created ${outputName}`);
      } catch (error) {
        console.error(`✗ Failed to process ${file} at ${sizeName}: ${error.message}`);
      }
    }
  }
  
  console.log('Image optimization complete!');
}

// Run the optimization
optimizeImages().catch(console.error);