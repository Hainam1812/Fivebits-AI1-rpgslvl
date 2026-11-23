#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const carouselComponentPath = path.join(rootDir, 'src', 'components', 'ui', 'HomeCarousel.tsx');
const defaultCarouselDir = path.join(publicDir, 'assets', 'carousel');

const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MOBILE_SUFFIX = '-mobile-4x5.webp';

const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');
const dirArgIdx = args.indexOf('--dir');
const customScanDir =
  dirArgIdx !== -1 && args[dirArgIdx + 1]
    ? path.resolve(rootDir, args[dirArgIdx + 1])
    : null;

function parseFocalPointPercent(focalPoint) {
  if (focalPoint === 'left') return 0;
  if (focalPoint === 'right') return 100;
  if (typeof focalPoint === 'number' && Number.isFinite(focalPoint)) {
    return Math.max(0, Math.min(100, focalPoint));
  }
  return 50; // default 'center'
}

function getMobileOutputPath(srcFilePath) {
  const parsed = path.parse(srcFilePath);
  return path.join(parsed.dir, `${parsed.name}${MOBILE_SUFFIX}`);
}

/**
 * Extracts slide image paths and optional focalPoint values from HomeCarousel.tsx
 * without hardcoding any image filenames.
 */
function discoverSlidesFromComponent() {
  if (!fs.existsSync(carouselComponentPath)) return [];
  const source = fs.readFileSync(carouselComponentPath, 'utf-8');

  // Collect ES static imports in case user switches to importing images directly
  const importMap = new Map();
  const importRegex = /import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]\s*;/g;
  let impMatch;
  while ((impMatch = importRegex.exec(source)) !== null) {
    importMap.set(impMatch[1], impMatch[2]);
  }

  const slidesMatch = source.match(/const\s+SLIDES(?:\s*:\s*[^=]+)?\s*=\s*\[([\s\S]*?)\n\]\s*;/);
  if (!slidesMatch) return [];

  const slidesBody = slidesMatch[1];
  const entries = [];

  // Extract balanced top-level { ... } blocks so ${baseUrl} inside template strings works
  const blocks = [];
  let depth = 0;
  let blockStart = -1;
  for (let i = 0; i < slidesBody.length; i++) {
    const ch = slidesBody[i];
    if (ch === '{') {
      if (depth === 0) blockStart = i + 1;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && blockStart !== -1) {
        blocks.push(slidesBody.slice(blockStart, i));
        blockStart = -1;
      }
    }
  }

  for (const block of blocks) {
    let rawSrc = null;
    const srcStringMatch = block.match(/src\s*:\s*(?:`([^`]*)`|['"]([^'"]*)['"])/);
    if (srcStringMatch) {
      rawSrc = srcStringMatch[1] ?? srcStringMatch[2];
    } else {
      const srcIdentMatch = block.match(/src\s*:\s*([A-Za-z0-9_$]+)/);
      if (srcIdentMatch && importMap.has(srcIdentMatch[1])) {
        rawSrc = importMap.get(srcIdentMatch[1]);
      }
    }

    if (!rawSrc) continue;
    rawSrc = rawSrc.replace(/\$\{[^}]+\}/g, '').trim();
    if (/^(https?:|data:|blob:)/i.test(rawSrc)) continue;

    let filePath = null;
    if (rawSrc.startsWith('/')) {
      filePath = path.join(publicDir, rawSrc.slice(1));
    } else if (rawSrc.startsWith('.')) {
      filePath = path.resolve(path.dirname(carouselComponentPath), rawSrc);
    } else {
      filePath = path.join(publicDir, rawSrc);
    }

    let focalPoint = 'center';
    const focalStrMatch = block.match(/focalPoint\s*:\s*['"](left|center|right)['"]/);
    const focalNumMatch = block.match(/focalPoint\s*:\s*(\d+(?:\.\d+)?)/);
    if (focalStrMatch) {
      focalPoint = focalStrMatch[1];
    } else if (focalNumMatch) {
      focalPoint = Number(focalNumMatch[1]);
    }

    entries.push({ filePath, focalPoint });
  }

  return entries;
}

function discoverImagesInDir(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...discoverImagesInDir(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTS.has(ext) && !entry.name.endsWith(MOBILE_SUFFIX)) {
        results.push({ filePath: fullPath, focalPoint: 'center' });
      }
    }
  }
  return results;
}

function getImageDimensions(filePath) {
  try {
    const out = execFileSync('identify', ['-format', '%w %h', `${filePath}[0]`], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const [w, h] = out.split(/\s+/).map(Number);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  } catch {
    // Fallback to ffprobe
  }

  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', filePath],
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim();
  const [w, h] = out.split('x').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error(`Không đọc được kích thước ảnh: ${filePath}`);
  }
  return { width: w, height: h };
}

function cropToMobileWebp(srcPath, outPath, cropW, cropH, cropX) {
  try {
    execFileSync(
      'convert',
      [srcPath, '-crop', `${cropW}x${cropH}+${cropX}+0`, '+repage', '-quality', '80', outPath],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return;
  } catch {
    // Fallback to ffmpeg
  }

  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      srcPath,
      '-vf',
      `crop=${cropW}:${cropH}:${cropX}:0`,
      '-c:v',
      'libwebp',
      '-quality',
      '80',
      outPath,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

console.log('=== [SOLO LEVELLING] Tạo ảnh mobile 4:5 cho carousel ===');

const targetsByPath = new Map();
for (const item of discoverImagesInDir(defaultCarouselDir)) {
  targetsByPath.set(path.resolve(item.filePath), item.focalPoint);
}
if (customScanDir) {
  for (const item of discoverImagesInDir(customScanDir)) {
    targetsByPath.set(path.resolve(item.filePath), item.focalPoint);
  }
}
for (const item of discoverSlidesFromComponent()) {
  targetsByPath.set(path.resolve(item.filePath), item.focalPoint);
}

if (targetsByPath.size === 0) {
  console.log('ℹ️ Không tìm thấy ảnh carousel nào để xử lý.');
  process.exit(0);
}

let createdCount = 0;
let skippedCount = 0;

for (const [srcPath, focalPoint] of targetsByPath.entries()) {
  const relSrc = path.relative(rootDir, srcPath);
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️ Bỏ qua (không tìm thấy file): ${relSrc}`);
    skippedCount++;
    continue;
  }

  if (srcPath.endsWith(MOBILE_SUFFIX)) {
    skippedCount++;
    continue;
  }

  const outPath = getMobileOutputPath(srcPath);
  const relOut = path.relative(rootDir, outPath);

  const { width: W, height: H } = getImageDimensions(srcPath);
  const outWidth = Math.round((H * 4) / 5);

  // Rule 4: If W <= H * 4/5, do not crop horizontally; remove stale mobile file if any
  if (W <= outWidth) {
    console.log(`⏭️ Bỏ qua cắt ngang (${W}×${H} đã hẹp hơn/bằng 4:5): ${relSrc}`);
    skippedCount++;
    continue;
  }

  if (!forceRegenerate && fs.existsSync(outPath)) {
    const srcMtime = fs.statSync(srcPath).mtimeMs;
    const outMtime = fs.statSync(outPath).mtimeMs;
    if (outMtime >= srcMtime) {
      console.log(`✓ Đã có bản mobile mới hơn: ${relOut}`);
      skippedCount++;
      continue;
    }
  }

  const pct = parseFocalPointPercent(focalPoint);
  const maxX = W - outWidth;
  const cropX = Math.max(0, Math.min(maxX, Math.round(maxX * (pct / 100))));

  cropToMobileWebp(srcPath, outPath, outWidth, H, cropX);
  console.log(`✅ Đã tạo (${W}×${H} -> ${outWidth}×${H}, x=${cropX}, focal=${focalPoint}): ${relOut}`);
  createdCount++;
}

console.log(`\nHoàn tất: tạo/cập nhật ${createdCount} ảnh, bỏ qua ${skippedCount} ảnh.`);
