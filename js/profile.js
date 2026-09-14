(() => {
	'use strict';

	const init = () => {
		const form = document.querySelector('#profile form');
		if (!form) return;

		const photoButton = form.querySelector('.avatar-row .button');
		const avatar = form.querySelector('.avatar');
		const username = form.querySelector('input[type="text"]');
		const displayName = form.querySelectorAll('input[type="text"]')[1];
		const saveButton = form.querySelector('.primary');
		const storageKey = 'sakura-profile';
		const avatarPhotoKey = 'sakura-avatar-photo';
		const settingsKey = 'sakura-profile-settings';
		const appearanceKey = 'sakura-appearance';
		const adminAccess = document.querySelector('#adminAccess');
		const adminAccessButton = document.querySelector('#adminAccessButton');
		const cosmeticCatalog = {
			'rose-crown': { group: 'avatarCosmetic', label: 'Rose Crown', icon: '🌹' },
			'moon-glasses': { group: 'avatarCosmetic', label: 'Moon Glasses', icon: '🌙' },
			'cloud-room': { group: 'profileBackground', label: 'Cloud Room', color: '#c7e8f5' },
			'sakura-garden': { group: 'profileBackground', label: 'Sakura Garden', color: '#f4c2d7' },
			'lavender': { group: 'profileTheme', label: 'Lavender Dream', accent: '#7857e8', soft: '#f0edff' },
			'sunset': { group: 'profileTheme', label: 'Soft Sunset', accent: '#c96b4c', soft: '#fff0e9' },
			'starlight': { group: 'profileTheme', label: 'Starlight', accent: '#3389aa', soft: '#e9f8fc' }
		};

		const fields = {
			username,
			displayName,
			bio: form.querySelector('textarea'),
			pronouns: form.querySelector('select'),
			location: form.querySelectorAll('input[type="text"]')[2],
			website: form.querySelector('input[type="url"]')
		};

		const updateAvatar = () => {
			const name = (fields.displayName.value.trim() || fields.username.value.trim() || 'SK')
				.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
			const equipped = readJson(appearanceKey, {});
			const cosmetic = cosmeticCatalog[equipped.avatarCosmetic];
			const photo = readStorage(avatarPhotoKey, '');
			avatar.style.background = photo ? `url("${photo}") center/cover` : '';
			avatar.textContent = photo ? '' : cosmetic ? `${cosmetic.icon} ${name || 'SK'}` : name || 'SK';
			avatar.title = cosmetic ? `${cosmetic.label} equipped` : 'Avatar preview';
		};

		const readStorage = (key, fallback = '') => {
			try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
		};

		const saveStorage = (key, value) => {
			try { localStorage.setItem(key, value); } catch (_) { /* Browser storage may be unavailable. */ }
		};

		const readJson = (key, fallback) => {
			try {
				const value = JSON.parse(localStorage.getItem(key));
				return value && typeof value === 'object' ? value : fallback;
			} catch (_) {
				return fallback;
			}
		};

		const saveJson = (key, value) => {
			try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Browser storage may be unavailable. */ }
		};

		const applyAppearance = () => {
			const equipped = readJson(appearanceKey, {});
			const background = cosmeticCatalog[equipped.profileBackground];
			const theme = cosmeticCatalog[equipped.profileTheme];
			document.body.style.background = background?.color || '';
			document.documentElement.style.setProperty('--accent', theme?.accent || '#7857e8');
			document.documentElement.style.setProperty('--accent-soft', theme?.soft || '#f0edff');
			updateAvatar();
		};

		const renderCosmetics = () => {
			const owned = (() => {
				try {
					const value = JSON.parse(localStorage.getItem('sakura-owned') || '[]');
					return Array.isArray(value) ? value : [];
				} catch (_) { return []; }
			})();
			const equipped = readJson(appearanceKey, {});
			const selects = ['avatarCosmetic', 'profileBackground', 'profileTheme'];
			selects.forEach(group => {
				const select = document.querySelector(`#${group}`);
				if (!select) return;
				select.replaceChildren(new Option(group === 'avatarCosmetic' ? 'Default initials' : `Default ${group === 'profileBackground' ? 'background' : 'theme'}`, ''));
				owned.filter(id => cosmeticCatalog[id]?.group === group).forEach(id => select.add(new Option(cosmeticCatalog[id].label, id)));
				select.value = equipped[group] || '';
				select.addEventListener('change', () => {
					const next = readJson(appearanceKey, {});
					if (select.value) next[group] = select.value;
					else delete next[group];
					saveJson(appearanceKey, next);
					applyAppearance();
					const status = document.querySelector('#cosmeticStatus');
					if (status) status.textContent = select.value ? `${cosmeticCatalog[select.value].label} equipped.` : 'Cosmetic removed.';
				});
			});
			const status = document.querySelector('#cosmeticStatus');
			if (status && owned.some(id => cosmeticCatalog[id])) status.textContent = 'Your owned cosmetics are ready to equip.';
		};

		const restoreSettings = () => {
			const settings = readJson(settingsKey, { discoverable: true });
			document.querySelectorAll('[data-setting]').forEach(input => { input.checked = settings[input.dataset.setting] ?? input.checked; });
		};

		const updateAdminAccess = async () => {
			if (!adminAccess || !adminAccessButton) return;
			try {
				const accessResponse = await fetch(`/api/admin/access?username=${encodeURIComponent(fields.username.value.trim())}`);
				const access = await accessResponse.json();
				adminAccess.hidden = !access.isAdmin;
				if (access.isAdmin) {
					const sessionResponse = await fetch('/api/admin/session');
					const session = await sessionResponse.json();
					adminAccessButton.textContent = session.authenticated ? 'Open admin panel' : 'Admin sign in';
				}
			} catch (_) {
				adminAccess.hidden = true;
			}
		};

		const setStatus = message => {
			let status = form.querySelector('.form-status');
			if (!status) {
				status = document.createElement('span');
				status.className = 'form-status hint';
				form.querySelector('.actions').prepend(status);
			}
			status.textContent = message;
			window.clearTimeout(setStatus.timer);
			setStatus.timer = window.setTimeout(() => { status.textContent = ''; }, 3000);
		};

		try {
			const saved = JSON.parse(localStorage.getItem(storageKey));
			if (saved) Object.entries(fields).forEach(([key, field]) => {
				if (field && saved[key] !== undefined) field.value = saved[key];
			});
		} catch (_) { /* Storage may be unavailable. */ }
		updateAvatar();
		applyAppearance();
		renderCosmetics();
		restoreSettings();
		updateAdminAccess();

		form.addEventListener('submit', event => {
			event.preventDefault();
			if (!form.reportValidity()) return;
			const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]));
			try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) { /* Ignore storage errors. */ }
			updateAvatar();
			updateAdminAccess();
			setStatus('Changes saved');
		});

		form.addEventListener('reset', event => {
			event.preventDefault();
			const saved = readJson(storageKey, {});
			Object.entries(fields).forEach(([key, field]) => { if (saved[key] !== undefined) field.value = saved[key]; });
			updateAvatar();
			setStatus('Changes discarded');
		});
		displayName.addEventListener('input', updateAvatar);
		username.addEventListener('input', updateAvatar);
		username.addEventListener('input', updateAdminAccess);
		document.querySelectorAll('[data-setting]').forEach(input => input.addEventListener('change', () => {
			const settings = readJson(settingsKey, {});
			settings[input.dataset.setting] = input.checked;
			saveJson(settingsKey, settings);
		}));

		adminAccessButton?.addEventListener('click', async () => {
			const sessionResponse = await fetch('/api/admin/session');
			const session = await sessionResponse.json();
			window.location.href = session.authenticated
				? '/admin'
				: `/admin/login?username=${encodeURIComponent(fields.username.value.trim())}&returnTo=/admin`;
		});

		photoButton.addEventListener('click', () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/jpeg,image/png,image/gif';
			input.addEventListener('change', () => {
				const file = input.files[0];
				if (!file || file.size > 5 * 1024 * 1024) return setStatus('Choose an image under 5 MB');
				const reader = new FileReader();
				reader.onload = () => {
					saveStorage(avatarPhotoKey, reader.result);
					updateAvatar();
				};
				reader.readAsDataURL(file);
			});
			input.click();
		});

		document.querySelector('.danger')?.addEventListener('click', () => {
			if (window.confirm('Delete your profile? This cannot be undone.')) {
				localStorage.removeItem(storageKey);
				localStorage.removeItem(settingsKey);
				localStorage.removeItem(appearanceKey);
				localStorage.removeItem(avatarPhotoKey);
				applyAppearance();
				setStatus('Profile data cleared');
			}
		});
	};

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
