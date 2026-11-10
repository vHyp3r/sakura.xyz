(() => {
  const content = document.querySelector('#mobile-content');
  const shell = document.querySelector('.phone-shell');
  const profileBtn = document.querySelector('#profile-button');

  const views = {
    home: {
      title: 'Welcome back',
      description: 'Your Sakura space is ready. Pick up where you left off or start something new.',
      eyebrow: 'Sakura mobile',
      cards: [
        { heading: 'Continue exploring', text: 'Find new packs and community designs.', accent: 'pink' },
        { heading: 'Quick create', text: 'Build a banner or cape in the maker.', accent: 'cyan' },
        { heading: 'Check the shop', text: 'New ranks, cosmetics, and creator items.', accent: 'amber' },
        { heading: 'Your profile', text: 'Manage cosmetics, rank, and settings.', accent: 'pink' },
      ]
    },
    discover: {
      title: 'Discover',
      description: 'Browse fresh Minecraft designs from the community. Updated daily.',
      eyebrow: 'Browse designs',
      cards: [
        { heading: 'Popular packs', text: 'See what creators are sharing today.', accent: 'pink' },
        { heading: 'Trending banners', text: 'Top community banner designs this week.', accent: 'cyan' },
        { heading: 'Search packs', text: 'Find a texture pack or inspiration.', accent: 'amber' },
        { heading: 'Random discover', text: 'Get surprised with a random design.', accent: 'pink' },
      ]
    },
    create: {
      title: 'Create',
      description: 'Turn an idea into something you can share. Tools built for Minecraft creators.',
      eyebrow: 'Creative tools',
      cards: [
        { heading: 'Banner maker', text: 'Design a Minecraft banner with real patterns.', accent: 'pink' },
        { heading: 'Cape designer', text: 'Create custom capes for your profile.', accent: 'cyan' },
        { heading: 'Upload pack', text: 'Share a new texture pack with the community.', accent: 'amber' },
        { heading: 'Import template', text: 'Start from a community template.', accent: 'pink' },
      ]
    },
    shop: {
      title: 'Shop',
      description: 'Ranks, cosmetics, and creator items. Your keys unlock exclusive content.',
      eyebrow: 'Sakura shop',
      cards: [
        { heading: 'Featured items', text: 'Explore the rotating Sakura shop selection.', accent: 'pink' },
        { heading: 'Your keys', text: 'View and redeem rank keys you own.', accent: 'cyan' },
        { heading: 'Cosmetics', text: 'Banners, capes, particles, and trails.', accent: 'amber' },
        { heading: 'Rank upgrades', text: 'Unlock perks, colors, and exclusive access.', accent: 'pink' },
      ]
    },
    profile: {
      title: 'Profile',
      description: 'Manage your account, cosmetics, and rank. Everything that makes you, you.',
      eyebrow: 'Your account',
      cards: [
        { heading: 'Account settings', text: 'Open your Sakura profile and preferences.', accent: 'pink' },
        { heading: 'My cosmetics', text: 'Choose the banners, capes, and items you own.', accent: 'cyan' },
        { heading: 'Rank & keys', text: 'View your current rank and available keys.', accent: 'amber' },
        { heading: 'Activity', text: 'Your creations, likes, and community stats.', accent: 'pink' },
      ]
    },
  };

  function render(viewName) {
    const view = views[viewName];
    if (!view) return;

    const cardsHtml = view.cards.map((card, i) => `
      <article class="card" data-accent="${card.accent}" style="animation-delay: ${i * 60}ms">
        <strong>${card.heading}</strong>
        <small>${card.text}</small>
      </article>
    `).join('');

    content.innerHTML = `
      <div class="view stagger ${viewName === 'home' ? 'welcome' : ''}">
        <p class="eyebrow">${view.eyebrow}</p>
        <h1>${view.title}</h1>
        <p>${view.description}</p>
        <div class="cards">${cardsHtml}</div>
      </div>
    `;

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });
  }

  function updateDeviceMode() {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isWide = window.innerWidth / window.innerHeight > 1.35;
    shell.dataset.deviceMode = isLandscape && isWide ? 'duo' : 'phone';
    shell.dataset.orientation = isLandscape ? 'landscape' : 'portrait';
  }

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => render(item.dataset.view));
  });

  profileBtn.addEventListener('click', () => render('profile'));

  window.addEventListener('resize', updateDeviceMode, { passive: true });
  window.addEventListener('orientationchange', updateDeviceMode, { passive: true });

  updateDeviceMode();
  render('home');
})();