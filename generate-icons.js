import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = './public';

// Create a simple SVG and convert to PNG
const svg = `
  <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad)"/>
    <text x="256" y="280" font-size="280" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">🛒</text>
  </svg>
`;

const svgBuffer = Buffer.from(svg);

// Generate icons
const sizes = [192, 512];

Promise.all([
  ...sizes.map(size =>
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `pwa-${size}x${size}.png`))
  ),
  ...sizes.map(size =>
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `pwa-maskable-${size}x${size}.png`))
  ),
  sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
])
  .then(() => console.log('✓ PWA icons generated successfully'))
  .catch(err => console.error('Error generating icons:', err));
