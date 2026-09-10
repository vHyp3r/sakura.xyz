(() => {
	const storageKey = "sakuraUserUUID";

	// Create one UUID per browser/user and reuse it on future homepage visits.
	if (!localStorage.getItem(storageKey)) {
		const uuid = crypto.randomUUID
			? crypto.randomUUID()
			: ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
					(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
				);

		localStorage.setItem(storageKey, uuid);
	}
})();
