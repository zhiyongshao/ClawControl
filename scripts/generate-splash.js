const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BACKGROUND_COLOR = '#06080a';
const SPLASH_SIZE = 2732; // iOS max dimension
const LOGO_SIZE = 512;

async function generateSplash() {
  const buildDir = path.join(__dirname, '..', 'build');
  const iconPath = path.join(buildDir, 'icon.png');
  const splashPath = path.join(buildDir, 'splash.png');

  // Create dark blue background with centered logo
  const background = await sharp({
    create: {
      width: SPLASH_SIZE,
      height: SPLASH_SIZE,
      channels: 4,
      background: BACKGROUND_COLOR
    }
  }).png().toBuffer();

  // Resize logo and composite onto background
  const logo = await sharp(iconPath)
    .resize(LOGO_SIZE, LOGO_SIZE)
    .toBuffer();

  await sharp(background)
    .composite([{
      input: logo,
      gravity: 'center'
    }])
    .toFile(splashPath);

  console.log(`✓ Splash screen created at ${splashPath}`);
}

generateSplash().catch(console.error);
