(() => {
	const products = [
		{ id: "rose-crown", name: "Rose Crown", type: "Avatar cosmetics", price: 240, icon: "🌹", color: "#f7b6ca" },
		{ id: "moon-glasses", name: "Moon Glasses", type: "Avatar cosmetics", price: 180, icon: "🌙", color: "#b7c8ff" },
		{ id: "cloud-room", name: "Cloud Room", type: "Backgrounds", price: 320, icon: "☁️", color: "#c7e8f5" },
		{ id: "sakura-garden", name: "Sakura Garden", type: "Backgrounds", price: 400, icon: "🌸", color: "#f4c2d7" },
		{ id: "lavender", name: "Lavender Dream", type: "Themes", price: 500, icon: "💜", color: "#d9c6f7" },
		{ id: "sunset", name: "Soft Sunset", type: "Themes", price: 450, icon: "🌅", color: "#ffc69b" },
		{ id: "starlight", name: "Starlight", type: "Themes", price: 550, icon: "✨", color: "#e0f7ff" }	
    ];

	const readStorage = (key, fallback) => {
		try {
			const value = localStorage.getItem(key);
			return value === null ? fallback : value;
		} catch (_) {
			return fallback;
		}
	};
	const readOwned = () => {
		try {
			const owned = JSON.parse(readStorage("sakura-owned", "[]"));
			return Array.isArray(owned) ? owned : [];
		} catch (_) {
			return [];
		}
	};
	const saveStorage = (key, value) => {
		try { localStorage.setItem(key, value); } catch (_) { /* Keep the current session usable when storage is blocked. */ }
	};
	const state = { balance: Number(readStorage("sakura-coins", 1200)) || 1200, owned: readOwned(), filter: "All" };
	let dailyTimer = null;
	const style = document.createElement("style");
	style.textContent = `
		.sakura-shop{max-width:980px;margin:2rem auto;padding:2rem;font:16px system-ui,sans-serif;color:#35283d;background:#fff8fc;border-radius:24px;box-shadow:0 12px 40px #7f52631c}.sakura-shop h1{margin:0 0 .25rem;font-size:2rem}.shop-sub{color:#8a7184;margin-top:0}.shop-bar{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:1.5rem 0}.shop-tabs button{border:0;background:#f4e6f0;color:#76556b;padding:.65rem 1rem;border-radius:999px;cursor:pointer}.shop-tabs button.active{background:#d86c9b;color:white}.shop-balance{margin-left:auto;background:#fff;border:1px solid #f0d9e5;padding:.65rem 1rem;border-radius:999px;font-weight:700}.shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.shop-card{background:white;border:1px solid #f0dce7;border-radius:18px;overflow:hidden}.shop-art{height:130px;display:grid;place-items:center;font-size:4rem}.shop-card-body{padding:1rem}.shop-card h3{margin:.2rem 0}.shop-type{font-size:.8rem;color:#987b91}.shop-buy{width:100%;margin-top:.8rem;padding:.7rem;border:0;border-radius:10px;background:#35283d;color:white;font-weight:700;cursor:pointer}.shop-buy:disabled{background:#d7ccd5;cursor:not-allowed}.shop-message{min-height:1.3em;color:#b34c78;font-size:.9rem}.daily-panel{grid-column:1/-1;background:linear-gradient(135deg,#fff,#fff1f7);border:1px solid #f0d2e1;border-radius:18px;padding:1.25rem}.daily-head{display:flex;justify-content:space-between;align-items:start;gap:1rem;margin-bottom:1rem}.daily-head h2{margin:.2rem 0;font-size:1.35rem}.daily-kicker{margin:0;color:#b34c78;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.daily-reset{color:#987b91;font-size:.82rem;text-align:right}.daily-reward{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;background:#fff;border:1px solid #f0dce7;border-radius:14px;margin-bottom:1rem}.daily-reward strong{display:block}.daily-reward small{color:#987b91}.daily-claim{padding:.65rem 1rem;border:0;border-radius:9px;background:#d86c9b;color:#fff;font-weight:700;cursor:pointer}.daily-claim:disabled{background:#d7ccd5;cursor:not-allowed}.daily-timer{color:#b34c78;font-size:.85rem;font-weight:700}.daily-items{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem}.daily-items .shop-card{box-shadow:0 4px 16px #7f52630f}.daily-label{color:#b34c78;font-size:.8rem;font-weight:700;margin:0 0 .8rem}`;
	document.head.appendChild(style);

	const root = document.createElement("section");
	root.className = "sakura-shop";
	root.innerHTML = `<h1>🌸 Sakura Shop</h1><p class="shop-sub">Make your space feel like yours.</p><div class="shop-bar"><div class="shop-tabs"></div><div class="shop-balance"></div></div><div class="shop-message" aria-live="polite"></div><div class="shop-grid"></div>`;
	(document.querySelector("#shop") || document.body).appendChild(root);

	const tabs = ["All", "Daily", "Avatar cosmetics", "Backgrounds", "Themes"];
	const tabsEl = root.querySelector(".shop-tabs");
	tabs.forEach(tab => { const button = document.createElement("button"); button.textContent = tab; button.onclick = () => { state.filter = tab; render(); }; tabsEl.appendChild(button); });

	function getEstDayKey(timestamp = Date.now()) {
		return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
	}

	function getNextEstMidnight() {
		const currentKey = getEstDayKey();
		let low = Date.now();
		let high = low + 36 * 60 * 60 * 1000;
		while (getEstDayKey(high) === currentKey) high += 12 * 60 * 60 * 1000;
		while (high - low > 1000) {
			const middle = Math.floor((low + high) / 2);
			if (getEstDayKey(middle) === currentKey) low = middle;
			else high = middle;
		}
		return high;
	}

	function getDailyItems() {
		const dayNumber = Math.floor(new Date(`${getEstDayKey()}T00:00:00Z`).getTime() / 86400000);
		return [products[dayNumber % products.length], products[(dayNumber + 3) % products.length]];
	}

	function formatDuration(milliseconds) {
		const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
		const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
		const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
		const seconds = String(totalSeconds % 60).padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	}

	function renderProductCard(item, daily = false) {
		const owned = state.owned.includes(item.id), card = document.createElement("article"); card.className = "shop-card";
		card.innerHTML = `<div class="shop-art" style="background:${item.color}">${item.icon}</div><div class="shop-card-body"><span class="shop-type">${daily ? "Daily item" : item.type}</span><h3>${item.name}</h3><strong>🪙 ${item.price}</strong><button class="shop-buy" ${owned ? "disabled" : ""}>${owned ? "Owned ✓" : "Buy now"}</button></div>`;
		if (!owned) card.querySelector("button").onclick = () => buy(item);
		return card;
	}

	function renderDaily() {
		const grid = root.querySelector(".shop-grid");
		grid.replaceChildren();
		const claimAt = Number(readStorage("sakura-daily-claim", 0)) || 0;
		const claimReady = Date.now() - claimAt >= 24 * 60 * 60 * 1000;
		const resetAt = getNextEstMidnight();
		const panel = document.createElement("section"); panel.className = "daily-panel";
		panel.innerHTML = `<div class="daily-head"><div><p class="daily-kicker">Daily rotation</p><h2>Small joys, every day</h2><span class="daily-timer">Items refresh in ${formatDuration(resetAt - Date.now())}</span></div><div class="daily-reset">Eastern Time<br><strong>${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date())}</strong></div></div><div class="daily-reward"><div><strong>Daily Sakura coins</strong><small>Claim 400 coins once every 24 hours after claiming.</small></div><button class="daily-claim" ${claimReady ? "" : "disabled"}>${claimReady ? "Claim 400 coins" : `Available in ${formatDuration(24 * 60 * 60 * 1000 - (Date.now() - claimAt))}`}</button></div><p class="daily-label">Today's items</p><div class="daily-items"></div>`;
		const items = panel.querySelector(".daily-items"); getDailyItems().forEach((item) => items.appendChild(renderProductCard(item, true)));
		const claimButton = panel.querySelector(".daily-claim");
		claimButton.onclick = () => {
			state.balance += 400; saveStorage("sakura-coins", state.balance); saveStorage("sakura-daily-claim", Date.now()); root.querySelector(".shop-message").textContent = "400 Sakura coins added to your balance!"; render();
		};
		grid.appendChild(panel);
		const dayKey = getEstDayKey();
		dailyTimer = window.setInterval(() => {
			if (state.filter !== "Daily") return;
			if (getEstDayKey() !== dayKey) return render();
			const claimedAt = Number(readStorage("sakura-daily-claim", 0)) || 0;
			const ready = Date.now() - claimedAt >= 24 * 60 * 60 * 1000;
			claimButton.disabled = !ready;
			claimButton.textContent = ready ? "Claim 400 coins" : `Available in ${formatDuration(24 * 60 * 60 * 1000 - (Date.now() - claimedAt))}`;
			panel.querySelector(".daily-timer").textContent = `Items refresh in ${formatDuration(getNextEstMidnight() - Date.now())}`;
		}, 1000);
	}

	function render() {
		if (dailyTimer) { window.clearInterval(dailyTimer); dailyTimer = null; }
		root.querySelector(".shop-balance").textContent = `🪙 ${state.balance} coins`;
		tabsEl.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.textContent === state.filter));
		if (state.filter === "Daily") return renderDaily();
		const grid = root.querySelector(".shop-grid"); grid.replaceChildren();
		products.filter(item => state.filter === "All" || item.type === state.filter).forEach(item => grid.appendChild(renderProductCard(item)));
	}
	function buy(item) {
		const message = root.querySelector(".shop-message");
		if (state.balance < item.price) { message.textContent = "You need more coins for this item."; return; }
		state.balance -= item.price; state.owned.push(item.id);
		saveStorage("sakura-coins", state.balance); saveStorage("sakura-owned", JSON.stringify(state.owned));
		message.textContent = `${item.name} added to your collection!`; render();
	}
	async function loadServerBalance() {
		try {
			const accountResponse = await fetch("/api/account/me", { cache: "no-store" });
			if (!accountResponse.ok) return;
			const accountResult = await accountResponse.json();
			if (!accountResult.authenticated || !accountResult.account?.username) return;
			const response = await fetch("/api/coins", { cache: "no-store" });
			if (!response.ok) return;
			const result = await response.json();
			if (Number.isInteger(result.balance) && result.balance >= 0) {
				state.balance = result.balance;
				saveStorage("sakura-coins", result.balance);
			}
		} catch (_) {
			// The local balance remains available when the server balance is unavailable.
		}
	}
	loadServerBalance().finally(render);
})();
