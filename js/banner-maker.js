(() => {
  const colors = [
    ['white', '#f4f4f1'], ['light_gray', '#b8b8b8'], ['gray', '#55565c'], ['black', '#17181f'],
    ['red', '#b9362c'], ['orange', '#e87519'], ['yellow', '#e4b52c'], ['lime', '#76b82a'],
    ['green', '#397b3f'], ['cyan', '#38aebd'], ['light_blue', '#4ca8d1'], ['blue', '#3b55a6'],
    ['purple', '#8741a8'], ['magenta', '#c8489e'], ['pink', '#e58cac'], ['brown', '#855330'],
  ];
  const patterns = [
    ['base', 'Base'], ['stripe_bottom', 'Stripe bottom'], ['stripe_top', 'Stripe top'],
    ['stripe_left', 'Stripe left'], ['stripe_right', 'Stripe right'],
    ['square_bottom_left', 'Square bottom left'], ['square_bottom_right', 'Square bottom right'],
    ['square_top_left', 'Square top left'], ['square_top_right', 'Square top right'],
    ['half_vertical', 'Half vertical'], ['half_vertical_right', 'Half vertical right'],
    ['stripe_center', 'Stripe center'], ['stripe_middle', 'Stripe middle'],
    ['stripe_downright', 'Diagonal right'], ['stripe_downleft', 'Diagonal left'],
    ['small_stripes', 'Small stripes'], ['cross', 'Cross'], ['straight_cross', 'Straight cross'],
    ['triangle_bottom', 'Triangle bottom'], ['triangle_top', 'Triangle top'],
    ['triangles_bottom', 'Triangles bottom'], ['triangles_top', 'Triangles top'],
    ['diagonal_left', 'Diagonal left'], ['diagonal_right', 'Diagonal right'],
    ['diagonal_up_left', 'Diagonal up left'], ['diagonal_up_right', 'Diagonal up right'],
    ['circle', 'Circle'], ['rhombus', 'Rhombus'], ['border', 'Border'],
    ['gradient', 'Gradient'], ['gradient_up', 'Gradient up'], ['bricks', 'Bricks'],
    ['creeper', 'Creeper'], ['skull', 'Skull'], ['flower', 'Flower'],
    ['mojang', 'Mojang'], ['globe', 'Globe'], ['piglin', 'Piglin'], ['flow', 'Flow'],
    ['curly_border', 'Curly border'], ['guster', 'Guster'],
    ['half_horizontal', 'Half horizontal'], ['half_horizontal_bottom', 'Half horizontal bottom'],
  ];
  const state = { layers: [{ pattern: 'base', color: 'white' }], selected: 0, command: 'banner' };
  const canvas = document.querySelector('#preview');
  const context = canvas.getContext('2d');
  const sprite = document.createElement('canvas');
  sprite.width = 20;
  sprite.height = 40;
  const spriteContext = sprite.getContext('2d');
  const palette = document.querySelector('#palette');
  const layers = document.querySelector('#layers');
  const colorSelect = document.querySelector('#color');
  const patternArea = document.querySelector('#patterns');
  const savedKey = 'sakura-banner-designs';
  const patternImages = new Map();
  const colorValue = (name) => colors.find(([id]) => id === name)?.[1] || '#f4f4f1';
  const patternLabel = (name) => patterns.find(([id]) => id === name)?.[1] || name;

  colorSelect.innerHTML = colors.map(([id, label]) => `<option value="${id}">${label.replace('_', ' ')}</option>`).join('');
  palette.innerHTML = colors.map(([id, value]) => `<button class="color" data-color="${id}" title="${id.replace('_', ' ')}" style="background:${value}"></button>`).join('');
  patternArea.innerHTML = patterns.map(([id, label]) => `<button class="pattern" data-pattern="${id}" title="${label}"><span></span></button>`).join('');
  patternArea.querySelectorAll('.pattern').forEach((button) => {
    button.querySelector('span').style.backgroundImage = `url("/banner-patterns/${button.dataset.pattern}.png")`;
    button.querySelector('span').style.backgroundSize = '100% 100%';
    button.querySelector('span').style.imageRendering = 'pixelated';
  });

  async function loadPatternImages() {
    await Promise.all(patterns.map(([id]) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { patternImages.set(id, image); resolve(); };
      image.onerror = resolve;
      image.src = `/banner-patterns/${id}.png`;
    })));
  }

  function drawSpritePattern(type, fill) {
    const image = patternImages.get(type);
    if (!image) return;
    const mask = document.createElement('canvas');
    mask.width = 20;
    mask.height = 40;
    const maskContext = mask.getContext('2d');
    maskContext.drawImage(image, 0, 0);
    const pixels = maskContext.getImageData(0, 0, 20, 40);
    const [red, green, blue] = fill.match(/\w\w/g).map((value) => parseInt(value, 16));
    for (let index = 0; index < pixels.data.length; index += 4) {
      const brightness = pixels.data[index] / 255;
      pixels.data[index] = red * brightness;
      pixels.data[index + 1] = green * brightness;
      pixels.data[index + 2] = blue * brightness;
    }
    maskContext.putImageData(pixels, 0, 0);
    spriteContext.drawImage(mask, 0, 0);
  }
  function render() {
    spriteContext.clearRect(0, 0, sprite.width, sprite.height);
    state.layers.forEach((layer) => drawSpritePattern(layer.pattern, colorValue(layer.color)));
    spriteContext.fillStyle = '#7b5234';
    spriteContext.fillRect(2, 0, 2, 40);
    spriteContext.fillRect(0, 0, 20, 2);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#dbe5df';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sprite, 30, 20, 260, 440);
    if (document.querySelector('#grid-toggle').checked) {
      context.strokeStyle = '#ffffff28'; context.lineWidth = 1;
      for (let x = 30; x <= 290; x += 13) { context.beginPath(); context.moveTo(x, 46); context.lineTo(x, 462); context.stroke(); }
      for (let y = 42; y <= 460; y += 11) { context.beginPath(); context.moveTo(30, y); context.lineTo(290, y); context.stroke(); }
    }
    renderLayers(); updateCommand(); updateShare();
  }
  function renderLayers() {
    layers.innerHTML = state.layers.map((layer, index) => `<div class="layer ${index === state.selected ? 'active' : ''}" data-index="${index}"><span class="layer-swatch" style="background:${colorValue(layer.color)}"></span><span class="layer-info"><strong>${patternLabel(layer.pattern)}</strong><small>${layer.color.replace('_', ' ')}</small></span><button class="layer-delete" data-delete="${index}" aria-label="Delete layer">×</button></div>`).reverse().join('');
    document.querySelector('#layer-count').textContent = `${state.layers.length} layer${state.layers.length === 1 ? '' : 's'}`;
    layers.querySelectorAll('.layer').forEach((item) => item.addEventListener('click', () => { state.selected = Number(item.dataset.index); syncControls(); render(); }));
    layers.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); if (state.layers.length === 1) return; state.layers.splice(Number(button.dataset.delete), 1); state.selected = Math.min(state.selected, state.layers.length - 1); render(); }));
  }
  function syncControls() { colorSelect.value = state.layers[state.selected].color; palette.querySelectorAll('.color').forEach((button) => button.classList.toggle('active', button.dataset.color === colorSelect.value)); }
  function updateCommand() {
    const patternsCommand = state.layers.filter((layer) => layer.pattern !== 'base').map((layer) => `{Pattern:${patternId(layer.pattern)},Color:${colorId(layer.color)}}`).join(',');
    const banner = `give @p minecraft:${state.layers[0]?.color || 'white'}_banner[patterns=[${patternsCommand}]]`;
    document.querySelector('#command').textContent = state.command === 'shield' ? `give @p minecraft:shield[base_color=${state.layers[0]?.color || 'white'},banner_patterns=[${patternsCommand}]]` : banner;
  }
  function patternId(pattern) { return pattern; }
  function colorId(color) { return color; }
  function updateShare() { document.querySelector('#share-link').value = `${location.origin}${location.pathname}#${btoa(JSON.stringify(state.layers)).replace(/=/g, '')}`; }
  function loadSaved() { const saved = JSON.parse(localStorage.getItem(savedKey) || '[]'); document.querySelector('#saved').innerHTML = saved.length ? saved.map((item, index) => `<div class="saved-item"><span>${item.name}</span><button data-load="${index}">Load</button></div>`).join('') : '<div class="empty">No saved banners yet.</div>'; document.querySelectorAll('[data-load]').forEach((button) => button.addEventListener('click', () => { state.layers = saved[button.dataset.load].layers; state.selected = 0; render(); })); }
  document.querySelector('#add-layer').addEventListener('click', () => { state.layers.push({ pattern: patternArea.querySelector('.active')?.dataset.pattern || 'stripe', color: colorSelect.value }); state.selected = state.layers.length - 1; render(); });
  patternArea.querySelectorAll('.pattern').forEach((button) => button.addEventListener('click', () => { patternArea.querySelectorAll('.pattern').forEach((item) => item.classList.remove('active')); button.classList.add('active'); }));
  palette.querySelectorAll('.color').forEach((button) => button.addEventListener('click', () => { state.layers[state.selected].color = button.dataset.color; syncControls(); render(); }));
  colorSelect.addEventListener('change', () => { state.layers[state.selected].color = colorSelect.value; render(); });
  document.querySelector('#grid-toggle').addEventListener('change', render);
  document.querySelector('#clear').addEventListener('click', () => { state.layers = [{ pattern: 'base', color: 'white' }]; state.selected = 0; render(); });
  document.querySelector('#randomize').addEventListener('click', () => { state.layers = [{ pattern: 'base', color: colors[Math.floor(Math.random() * colors.length)][0] }, ...Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({ pattern: patterns[1 + Math.floor(Math.random() * (patterns.length - 1))][0], color: colors[Math.floor(Math.random() * colors.length)][0] }))]; state.selected = 0; render(); });
  document.querySelector('#save').addEventListener('click', () => { const saved = JSON.parse(localStorage.getItem(savedKey) || '[]'); saved.unshift({ name: `Banner ${saved.length + 1}`, layers: state.layers }); localStorage.setItem(savedKey, JSON.stringify(saved.slice(0, 20))); loadSaved(); });
  document.querySelector('#clear-saved').addEventListener('click', () => { localStorage.removeItem(savedKey); loadSaved(); });
  document.querySelector('#copy-command').addEventListener('click', () => navigator.clipboard?.writeText(document.querySelector('#command').textContent));
  document.querySelector('#copy-share').addEventListener('click', () => navigator.clipboard?.writeText(document.querySelector('#share-link').value));
  document.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => { state.command = button.dataset.command; document.querySelectorAll('[data-command]').forEach((item) => item.classList.toggle('active', item === button)); updateCommand(); }));
  if (location.hash.length > 1) { try { state.layers = JSON.parse(atob(location.hash.slice(1))); } catch (_) {} }
  loadSaved(); syncControls();
  loadPatternImages().then(render);
})();
