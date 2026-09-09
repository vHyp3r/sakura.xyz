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
			avatar.textContent = name || 'SK';
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

		form.addEventListener('submit', event => {
			event.preventDefault();
			if (!form.reportValidity()) return;
			const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]));
			try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) { /* Ignore storage errors. */ }
			updateAvatar();
			setStatus('Changes saved');
		});

		form.addEventListener('reset', () => window.setTimeout(updateAvatar, 0));
		displayName.addEventListener('input', updateAvatar);
		username.addEventListener('input', updateAvatar);

		photoButton.addEventListener('click', () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/jpeg,image/png,image/gif';
			input.addEventListener('change', () => {
				const file = input.files[0];
				if (!file || file.size > 5 * 1024 * 1024) return setStatus('Choose an image under 5 MB');
				const reader = new FileReader();
				reader.onload = () => {
					avatar.textContent = '';
					avatar.style.background = `url(${reader.result}) center/cover`;
				};
				reader.readAsDataURL(file);
			});
			input.click();
		});

		document.querySelector('.danger')?.addEventListener('click', () => {
			if (window.confirm('Delete your profile? This cannot be undone.')) {
				localStorage.removeItem(storageKey);
				setStatus('Profile data cleared');
			}
		});
	};

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
