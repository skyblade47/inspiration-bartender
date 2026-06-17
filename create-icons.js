const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
  // 颜色：灵感调酒师主题色 - 紫色
  const size = 1024;
  
  // 创建主图标 SVG
  const svgIcon = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#6366f1" rx="128"/>
    <circle cx="${size/2}" cy="${size/2}" r="380" fill="#4f46e5"/>
    <text x="${size/2}" y="${size/2 + 100}" font-family="Arial, sans-serif" font-size="400" font-weight="bold" fill="white" text-anchor="middle">I</text>
  </svg>`;
  
  // 创建闪屏 SVG
  const splashWidth = 1284;
  const splashHeight = 2778;
  const svgSplash = `<svg width="${splashWidth}" height="${splashHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${splashWidth}" height="${splashHeight}" fill="#1a1410"/>
    <circle cx="${splashWidth/2}" cy="${splashHeight/2}" r="300" fill="#6366f1" opacity="0.3"/>
    <text x="${splashWidth/2}" y="${splashHeight/2}" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#6366f1" text-anchor="middle">灵感调酒师</text>
  </svg>`;
  
  const assetsDir = path.join(__dirname, 'assets');
  
  // 确保 assets 目录存在
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // 生成所有需要的图标
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Created icon.png (1024x1024)');
  
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Created adaptive-icon.png (1024x1024)');
  
  await sharp(Buffer.from(svgIcon))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Created favicon.png (48x48)');
  
  await sharp(Buffer.from(svgSplash))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('Created splash.png (1284x2778)');
  
  console.log('All icons created successfully!');
}

createIcons().catch(console.error);
