(() => {
  const content = document.querySelector('#mobile-content');
  const shell = document.querySelector('.phone-shell');
  const views = {
    home: ['Welcome back', 'Your Sakura space is ready.', [['Continue exploring', 'Find new packs and community designs.'], ['Quick create', 'Build a banner or cape in the maker.']]],
    discover: ['Discover', 'Browse fresh Minecraft designs from the community.', [['Popular packs', 'See what creators are sharing today.'], ['Search', 'Find a texture pack or inspiration.']]],
    create: ['Create', 'Turn an idea into something you can share.', [['Banner maker', 'Design a Minecraft banner with real patterns.'], ['Upload', 'Share a new texture pack with the community.']]],
    shop: ['Shop', 'Ranks, cosmetics, and creator items.', [['Featured items', 'Explore the rotating Sakura shop.'], ['Your keys', 'View and redeem rank keys.']]],
    profile: ['Profile', 'Manage your account, cosmetics, and rank.', [['Account', 'Open your Sakura profile.'], ['Cosmetics', 'Choose the items you own.']]],
  };
  function render(view) {
    const [title, description, cards] = views[view];
    content.innerHTML = `<div class="view ${view === 'home' ? 'welcome' : ''}"><p class="eyebrow">Sakura mobile</p><h1>${title}</h1><p>${description}</p><div class="cards">${cards.map(([heading, text]) => `<article class="card"><strong>${heading}</strong><small>${text}</small></article>`).join('')}</div></div>`;
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  }
  function updateDeviceMode() {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isWide = window.innerWidth / window.innerHeight > 1.35;
    shell.dataset.deviceMode = isLandscape && isWide ? 'duo' : 'phone';
    shell.dataset.orientation = isLandscape ? 'landscape' : 'portrait';
  }
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => render(item.dataset.view)));
  document.querySelector('#profile-button').addEventListener('click', () => render('profile'));
  window.addEventListener('resize', updateDeviceMode, { passive: true });
  window.addEventListener('orientationchange', updateDeviceMode, { passive: true });
  updateDeviceMode();
  render('home');
})();
