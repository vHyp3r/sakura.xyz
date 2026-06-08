export const sampleUploads = [
  {
    id: 'sample-1',
    owner: 'local-user',
    name: 'Sakura Texture Pack',
    filename: 'sakura-texture.zip',
    storagePath: 'uploads/local/sakura-texture.zip',
    downloadURL: 'https://example.com/downloads/sakura-texture.zip',
    description: 'A pastel-themed texture pack for Minecraft.',
    tags: ['texture', 'pack', 'pastel'],
    createdAt: Date.now(),
  },
  {
    id: 'sample-2',
    owner: 'local-user',
    name: 'Jiayi Launcher Mod',
    filename: 'jiayi-mod.zip',
    storagePath: 'uploads/local/jiayi-mod.zip',
    downloadURL: 'https://example.com/downloads/jiayi-mod.zip',
    description: 'Launcher integration example.',
    tags: ['launcher', 'mod'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  }
];
