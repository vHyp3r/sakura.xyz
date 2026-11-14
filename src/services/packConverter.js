const path = require('node:path');
const crypto = require('node:crypto');
const AdmZip = require('adm-zip');
const sharp = require('sharp');
const { PACK_CONVERTER } = require('../config/limits');

// Zip bomb protection limits
const { MAX_ENTRIES, MAX_UNCOMPRESSED_BYTES: MAX_UNCOMPRESSED_SIZE, MAX_COMPRESSION_RATIO } = PACK_CONVERTER;

function safeEntryName(name) {
  const normalized = path.posix.normalize(String(name || '').replace(/\\/g, '/'));
  // Additional defense: reject any path containing '..' segment after normalization
  const segments = normalized.split('/');
  const hasTraversal = segments.some(seg => seg === '..' || seg === '.');
  return normalized && normalized !== '.' && !normalized.startsWith('../') && !normalized.includes('/../') && !path.posix.isAbsolute(normalized) && !hasTraversal
    ? normalized
    : null;
}

function convertEntryName(name, direction) {
  if (direction === 'java-to-bedrock') {
    return name
      .replace(/^assets\/minecraft\/textures\//, 'textures/')
      .replace(/^assets\/minecraft\//, '')
      .replace(/(^|\/)block\//, '$1blocks/')
      .replace(/(^|\/)item\//, '$1items/');
  }
  return name
    .replace(/^textures\/(blocks|items)\//, (_, folder) => `assets/minecraft/textures/${folder.slice(0, -1)}/`)
    .replace(/^textures\//, 'assets/minecraft/textures/');
}

async function convertPack(buffer, filename, direction, targetVersion, options = {}) {
  const { preserveFormat = false } = options;
  const input = new AdmZip(buffer);
  const entries = input.getEntries();

  // Zip bomb protection: check entry count
  if (entries.length > MAX_ENTRIES) {
    throw new Error(`Archive contains too many entries (max ${MAX_ENTRIES}).`);
  }

  // Zip bomb protection: check total uncompressed size and compression ratio
  let totalUncompressed = 0;
  let totalCompressed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory) {
      totalUncompressed += entry.header.size || 0;
      totalCompressed += entry.header.compressedSize || 0;
    }
  }
  if (totalUncompressed > MAX_UNCOMPRESSED_SIZE) {
    throw new Error(`Archive uncompressed size exceeds ${MAX_UNCOMPRESSED_SIZE / 1024 / 1024} MB limit.`);
  }
  if (totalCompressed > 0 && totalUncompressed / totalCompressed > MAX_COMPRESSION_RATIO) {
    throw new Error(`Archive compression ratio exceeds ${MAX_COMPRESSION_RATIO}:1 limit (possible zip bomb).`);
  }

  const output = new AdmZip();
  const seen = new Set();

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const sourceName = safeEntryName(entry.entryName);
    if (!sourceName) continue;
    if ((direction === 'java-to-bedrock' && sourceName === 'pack.mcmeta')
      || (direction === 'bedrock-to-java' && sourceName === 'manifest.json')) continue;

    const outputName = safeEntryName(convertEntryName(sourceName, direction));
    if (!outputName || seen.has(outputName)) continue;
    let data = entry.getData();
    // Only re-encode if not preserving format, or if image needs conversion (e.g., JPEG -> PNG for Bedrock)
    if (!preserveFormat && /\.(png|jpe?g)$/i.test(outputName)) {
      data = await sharp(data).png().toBuffer();
    }
    output.addFile(outputName, data);
    seen.add(outputName);
  }

  const baseName = path.basename(filename, path.extname(filename)) || 'Converted Pack';
  if (direction === 'java-to-bedrock') {
    output.addFile('manifest.json', Buffer.from(JSON.stringify({
      format_version: 2,
      header: {
        name: baseName,
        description: `Converted for Minecraft Bedrock ${targetVersion}`,
        uuid: crypto.randomUUID(),
        version: [1, 0, 0],
      },
      modules: [{ type: 'resources', uuid: crypto.randomUUID(), version: [1, 0, 0] }],
    }, null, 2)));
  } else {
    output.addFile('pack.mcmeta', Buffer.from(JSON.stringify({
      pack: { pack_format: 15, description: `Converted for Minecraft Java ${targetVersion}` },
    }, null, 2)));
  }

  return {
    buffer: output.toBuffer(),
    filename: `${baseName}.${direction === 'java-to-bedrock' ? 'mcpack' : 'zip'}`,
  };
}

module.exports = { convertPack };
