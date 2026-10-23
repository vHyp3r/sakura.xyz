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

  function drawPattern(type, fill) {
    context.fillStyle = fill;
    if (type === 'base') return context.fillRect(50, 30, 220, 330);
    context.save();
    context.translate(50, 30);
    context.beginPath();
    if (type === 'stripe') context.moveTo(0, 0), context.lineTo(75, 0), context.lineTo(220, 330), context.lineTo(145, 330);
    if (type === 'cross') { context.moveTo(0, 60); context.lineTo(30, 30); context.lineTo(220, 300); context.lineTo(190, 330); context.closePath(); context.moveTo(190, 0); context.lineTo(220, 30); context.lineTo(30, 330); context.lineTo(0, 300); }
    if (type === 'circle') { context.arc(110, 165, 75, 0, Math.PI * 2); }
    if (type === 'border') { context.rect(0, 0, 220, 330); context.rect(22, 32, 176, 266); context.fill('evenodd'); context.restore(); return; }
    if (type === 'half') context.rect(0, 0, 110, 330);
    if (type === 'triangle') context.moveTo(0, 0), context.lineTo(220, 0), context.lineTo(110, 330);
    context.closePath(); context.fill(); context.restore();
  }
  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#e8e5d9'; context.fillRect(48, 28, 224, 334);
    state.layers.forEach((layer) => drawPattern(layer.pattern, colorValue(layer.color)));
    if (document.querySelector('#grid-toggle').checked) {
      context.strokeStyle = '#ffffff30'; context.lineWidth = 1;
      for (let x = 50; x <= 270; x += 22) { context.beginPath(); context.moveTo(x, 30); context.lineTo(x, 360); context.stroke(); }
      for (let y = 30; y <= 360; y += 22) { context.beginPath(); context.moveTo(50, y); context.lineTo(270, y); context.stroke(); }
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
