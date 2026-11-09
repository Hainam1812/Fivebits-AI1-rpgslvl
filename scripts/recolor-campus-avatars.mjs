import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Filter 0 (None) for each row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function unfilterPNG(buf) {
  let offset = 8, idatBuffers = [], width, height;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatBuffers.push(buf.slice(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
  }
  const data = zlib.inflateSync(Buffer.concat(idatBuffers));
  const bpp = 4;
  const stride = 1 + width * bpp;
  const uncompressed = Buffer.alloc(width * height * bpp);
  for (let y = 0; y < height; y++) {
    const filterType = data[y * stride];
    for (let x = 0; x < width * bpp; x++) {
      const rawVal = data[y * stride + 1 + x];
      let prevX = x >= bpp ? uncompressed[(y * width * bpp) + x - bpp] : 0;
      let prevY = y > 0 ? uncompressed[((y - 1) * width * bpp) + x] : 0;
      let prevXY = (x >= bpp && y > 0) ? uncompressed[((y - 1) * width * bpp) + x - bpp] : 0;
      let val = rawVal;
      if (filterType === 1) val = (rawVal + prevX) & 0xff;
      else if (filterType === 2) val = (rawVal + prevY) & 0xff;
      else if (filterType === 3) val = (rawVal + Math.floor((prevX + prevY) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = prevX + prevY - prevXY;
        const pa = Math.abs(p - prevX);
        const pb = Math.abs(p - prevY);
        const pc = Math.abs(p - prevXY);
        let pr = prevXY;
        if (pa <= pb && pa <= pc) pr = prevX;
        else if (pb <= pc) pr = prevY;
        val = (rawVal + pr) & 0xff;
      }
      uncompressed[y * width * bpp + x] = val;
    }
  }
  return { width, height, uncompressed };
}

function isBgPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // White/gray checkerboard or transparent white/gray
  return (min >= 115 && (max - min) <= 45) || (min >= 210);
}

const files = [
  'teamroom_70aad919.png',
  'club_d91a3edf.png',
  'park_8a55941b.png',
  'classroom_3a0c11c8.png',
  'auditorium_c93962d1.png',
  'gym_2624342e.png',
  'dormitory_b62878c1.png',
  'library_e66662d2.png',
  'computer_cdfab4ff.png'
];

// Target Navy Blue: #0F132E -> [15, 19, 46, 255]
const NAVY_R = 15;
const NAVY_G = 19;
const NAVY_B = 46;

for (const f of files) {
  const filePath = path.join('public/assets/aistudio', f);
  const fileBuf = fs.readFileSync(filePath);
  const { width, height, uncompressed } = unfilterPNG(fileBuf);

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0, qTail = 0;

  // Add all 4 borders if they match background
  for (let x = 0; x < width; x++) {
    let idx = 0 * width + x;
    if (isBgPixel(uncompressed[idx*4], uncompressed[idx*4+1], uncompressed[idx*4+2])) {
      visited[idx] = 1; queue[qTail++] = idx;
    }
    idx = (height - 1) * width + x;
    if (!visited[idx] && isBgPixel(uncompressed[idx*4], uncompressed[idx*4+1], uncompressed[idx*4+2])) {
      visited[idx] = 1; queue[qTail++] = idx;
    }
  }

  for (let y = 0; y < height; y++) {
    let idx = y * width + 0;
    if (!visited[idx] && isBgPixel(uncompressed[idx*4], uncompressed[idx*4+1], uncompressed[idx*4+2])) {
      visited[idx] = 1; queue[qTail++] = idx;
    }
    idx = y * width + width - 1;
    if (!visited[idx] && isBgPixel(uncompressed[idx*4], uncompressed[idx*4+1], uncompressed[idx*4+2])) {
      visited[idx] = 1; queue[qTail++] = idx;
    }
  }

  while (qHead < qTail) {
    const cur = queue[qHead++];
    const cx = cur % width;
    const cy = Math.floor(cur / width);
    if (cx > 0) {
      const n = cur - 1;
      if (!visited[n] && isBgPixel(uncompressed[n*4], uncompressed[n*4+1], uncompressed[n*4+2])) {
        visited[n] = 1; queue[qTail++] = n;
      }
    }
    if (cx < width - 1) {
      const n = cur + 1;
      if (!visited[n] && isBgPixel(uncompressed[n*4], uncompressed[n*4+1], uncompressed[n*4+2])) {
        visited[n] = 1; queue[qTail++] = n;
      }
    }
    if (cy > 0) {
      const n = cur - width;
      if (!visited[n] && isBgPixel(uncompressed[n*4], uncompressed[n*4+1], uncompressed[n*4+2])) {
        visited[n] = 1; queue[qTail++] = n;
      }
    }
    if (cy < height - 1) {
      const n = cur + width;
      if (!visited[n] && isBgPixel(uncompressed[n*4], uncompressed[n*4+1], uncompressed[n*4+2])) {
        visited[n] = 1; queue[qTail++] = n;
      }
    }
  }

  // Replace all visited background pixels with Navy Blue #0F132E
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      const px = i * 4;
      uncompressed[px] = NAVY_R;
      uncompressed[px + 1] = NAVY_G;
      uncompressed[px + 2] = NAVY_B;
      uncompressed[px + 3] = 255;
    }
  }

  const encoded = encodePNG(width, height, uncompressed);
  fs.writeFileSync(filePath, encoded);
  console.log(`Updated ${f} (${width}x${height}): converted ${qTail} px (${(qTail / (width * height) * 100).toFixed(1)}%) to navy blue #0F132E`);
}
