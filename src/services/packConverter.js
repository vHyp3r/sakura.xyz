const path = require('node:path');
const crypto = require('node:crypto');
const AdmZip = require('adm-zip');
const sharp = require('sharp');

function safeEntryName(name) {
  const normalized = path.posix.normalize(String(name || '').replace(/\\/g, '/'));
  return normalized && normalized !== '.' && !normalized.startsWith('../') && !normalized.includes('/../') && !path.posix.isAbsolute(normalized)
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

async function convertPack(buffer, filename, direction, targetVersion) {
  const input = new AdmZip(buffer);
  const output = new AdmZip();
  const seen = new Set();

  for (const entry of input.getEntries()) {
    if (entry.isDirectory) continue;
    const sourceName = safeEntryName(entry.entryName);
    if (!sourceName) continue;
    if ((direction === 'java-to-bedrock' && sourceName === 'pack.mcmeta')
      || (direction === 'bedrock-to-java' && sourceName === 'manifest.json')) continue;

    const outputName = safeEntryName(convertEntryName(sourceName, direction));
    if (!outputName || seen.has(outputName)) continue;
    let data = entry.getData();
    if (/\.(png|jpe?g)$/i.test(outputName)) data = await sharp(data).png().toBuffer();
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
