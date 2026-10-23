(() => {
  const colors = [
    ['white', '#f4f4f1'], ['light_gray', '#b8b8b8'], ['gray', '#55565c'], ['black', '#17181f'],
    ['red', '#b9362c'], ['orange', '#e87519'], ['yellow', '#e4b52c'], ['lime', '#76b82a'],
    ['green', '#397b3f'], ['cyan', '#38aebd'], ['light_blue', '#4ca8d1'], ['blue', '#3b55a6'],
    ['purple', '#8741a8'], ['magenta', '#c8489e'], ['pink', '#e58cac'], ['brown', '#855330'],
  ];
  const patterns = [
    ['base', 'Base'], ['stripe', 'Stripe'], ['cross', 'Cross'], ['circle', 'Circle'],
    ['border', 'Border'], ['half', 'Half'], ['triangle', 'Triangle'],
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
  const colorValue = (name) => colors.find(([id]) => id === name)?.[1] || '#f4f4f1';
  const patternLabel = (name) => patterns.find(([id]) => id === name)?.[1] || name;

  colorSelect.innerHTML = colors.map(([id, label]) => `<option value="${id}">${label.replace('_', ' ')}</option>`).join('');
  palette.innerHTML = colors.map(([id, value]) => `<button class="color" data-color="${id}" title="${id.replace('_', ' ')}" style="background:${value}"></button>`).join('');
  patternArea.innerHTML = patterns.map(([id, label]) => `<button class="pattern" data-pattern="${id}" title="${label}"><span></span></button>`).join('');

  function drawSpritePattern(type, fill) {
    spriteContext.fillStyle = fill;
    if (type === 'base') return spriteContext.fillRect(0, 2, 20, 32);
    for (let y = 2; y < 34; y += 1) {
      for (let x = 0; x < 20; x += 1) {
        let draw = false;
        if (type === 'stripe') draw = x >= Math.floor(y / 2) && x < Math.floor(y / 2) + 5;
        if (type === 'cross') draw = Math.abs(x - 10) <= Math.floor(y / 5) || Math.abs(x - 10) <= Math.floor((32 - y) / 5);
        if (type === 'circle') draw = ((x - 9.5) ** 2) / 60 + ((y - 18) ** 2) / 130 <= 1;
        if (type === 'border') draw = x < 2 || x > 17 || y < 4 || y > 31;
        if (type === 'half') draw = x < 10;
        if (type === 'triangle') draw = x >= Math.floor(y / 3) && x < 20 - Math.floor(y / 3);
        if (draw) spriteContext.fillRect(x, y, 1, 1);
      }
    }
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
  function patternId(pattern) { return ({ stripe: 'stripe', cross: 'cross', circle: 'circle', border: 'border', half: 'half', triangle: 'triangles' })[pattern] || pattern; }
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
  loadSaved(); syncControls(); render();
})();
