(() => {
	const products = [
		{ id: "rose-crown", name: "Rose Crown", type: "Avatar cosmetics", period: "daily", price: 240, icon: "🌹", color: "#f7b6ca" },
		{ id: "moon-glasses", name: "Moon Glasses", type: "Avatar cosmetics", period: "daily", price: 180, icon: "🌙", color: "#b7c8ff" },
		{ id: "cloud-room", name: "Cloud Room", type: "Backgrounds", period: "weekly", price: 320, icon: "☁️", color: "#c7e8f5" },
		{ id: "sakura-garden", name: "Sakura Garden", type: "Backgrounds", period: "weekly", price: 400, icon: "🌸", color: "#f4c2d7" },
		{ id: "lavender", name: "Lavender Dream", type: "Themes", period: "monthly", price: 500, icon: "💜", color: "#d9c6f7" },
		{ id: "sunset", name: "Soft Sunset", type: "Themes", period: "monthly", price: 450, icon: "🌅", color: "#ffc69b" },
		{ id: "starlight", name: "Starlight", type: "Themes", period: "seasonal", price: 550, icon: "✨", color: "#e0f7ff" },
		{ id: "sakura-classic", name: "Sakura Classic", type: "Themes", period: "permanent", price: 150, icon: "🌸", color: "#ffd6e7" },
		{ id: "rank-donator", name: "Donator", type: "Ranks", period: "permanent", price: null, icon: "✦", color: "#43c7df", rank: "Donator", donation: true, benefits: ["$1+ crypto donation", "Donator badge"] },
		{ id: "rank-vip", name: "VIP", type: "Ranks", period: "permanent", price: 2500, icon: "♛", color: "#3d9700", rank: "VIP", benefits: ["VIP badge", "Exclusive profile styling"] },
		{ id: "rank-mvp", name: "MVP", type: "Ranks", period: "permanent", price: 5000, icon: "★", color: "#ff8500", rank: "MVP", benefits: ["MVP badge", "Priority community perks"] }
    ];
	const periodLabels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", seasonal: "Seasonal", permanent: "Permanent" };

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
	const root = document.createElement("section");
	root.className = "sakura-shop";
	root.innerHTML = `<h1>🌸 Sakura Shop</h1><p class="shop-sub">Make your space feel like yours.</p><div class="shop-bar"><div class="shop-tabs"></div><div class="shop-balance"></div></div><div class="shop-message" aria-live="polite"></div><div class="shop-grid"></div>`;
	(document.querySelector("#shop") || document.body).appendChild(root);

	const tabs = ["All", "Daily", "Weekly", "Monthly", "Seasonal", "Permanent", "Avatar cosmetics", "Backgrounds", "Themes", "Ranks"];
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

	function getEstPeriodKey(period) {
		const now = new Date();
		const date = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
		const values = Object.fromEntries(date.map(part => [part.type, part.value]));
		if (period === "daily") return `${values.year}-${values.month}-${values.day}`;
		if (period === "monthly") return `${values.year}-${values.month}`;
		if (period === "seasonal") return `${values.year}-${values.month <= "02" || values.month === "12" ? "winter" : values.month <= "05" ? "spring" : values.month <= "08" ? "summer" : "autumn"}`;
		if (period === "weekly") {
			const day = new Date(`${values.year}-${values.month}-${values.day}T12:00:00Z`);
			const first = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
			return `${values.year}-W${String(Math.ceil((((day - first) / 86400000) + first.getUTCDay() + 1) / 7)).padStart(2, "0")}`;
		}
		return "permanent";
	}

	function seededShuffle(items, seed) {
		return [...items].sort((left, right) => {
			const leftValue = hash(`${seed}:${left.id}`);
			const rightValue = hash(`${seed}:${right.id}`);
			return leftValue - rightValue;
		});
	}

	function hash(value) {
		let result = 2166136261;
		for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
		return result >>> 0;
	}

	function getRotatedItems(period) {
		const periodItems = products.filter(item => item.period === period);
		const shuffled = seededShuffle(periodItems, `${period}:${getEstPeriodKey(period)}`);
		const limits = { daily: 2, weekly: 3, monthly: 4, seasonal: 5, permanent: periodItems.length };
		return shuffled.slice(0, limits[period]);
	}

	function getShopItems(period = "all") {
		if (period === "all") return ["daily", "weekly", "monthly", "seasonal"].flatMap(getRotatedItems).concat(getRotatedItems("permanent"));
		return getRotatedItems(period);
	}

	function formatDuration(milliseconds) {
		const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
		const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
		const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
		const seconds = String(totalSeconds % 60).padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	}

	function renderProductCard(item) {
		const owned = state.owned.includes(item.id), card = document.createElement("article"); card.className = "shop-card";
		const benefits = item.benefits ? `<ul class="shop-benefits">${item.benefits.map((benefit) => `<li>${benefit}</li>`).join("")}</ul>` : "";
		const price = item.donation ? "Crypto donation" : `🪙 ${item.price}`;
		card.innerHTML = `<div class="shop-art" style="background:${item.color}">${item.icon}</div><div class="shop-card-body"><div class="shop-meta"><span class="shop-type">${item.type}</span><span class="shop-period">${periodLabels[item.period]}</span></div><h3>${item.name}</h3>${item.rank ? `<span class="shop-rank" style="--rank-color:${item.color}">${item.rank} rank</span>` : ""}${benefits}<strong>${price}</strong><button class="shop-buy" ${owned ? "disabled" : ""}>${owned ? "Owned ✓" : item.donation ? "Donate crypto" : item.rank ? "Buy rank" : "Buy now"}</button></div>`;
		if (!owned) card.querySelector("button").onclick = () => item.donation ? (window.location.href = "/donate") : buyRank(item);
		return card;
	}

	async function buyRank(item) {
		const message = root.querySelector(".shop-message");
		if (!item.rank) return buy(item);
		message.textContent = "Issuing your rank key…";
		try {
			const response = await fetch("/api/ranks/purchase", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rank: item.rank })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Could not issue rank key.");
			state.owned.push(item.id);
			render();
			root.querySelector(".shop-message").innerHTML = `Your key is <strong>${result.key}</strong>. <a href="${result.redeemUrl}">Go to Redeem</a> to activate it.`;
		} catch (error) {
			message.textContent = error.message;
		}
	}

	function renderDaily() {
		const grid = root.querySelector(".shop-grid");
		grid.replaceChildren();
		const claimAt = Number(readStorage("sakura-daily-claim", 0)) || 0;
		const claimReady = Date.now() - claimAt >= 24 * 60 * 60 * 1000;
		const resetAt = getNextEstMidnight();
		const panel = document.createElement("section"); panel.className = "daily-panel";
		panel.innerHTML = `<div class="daily-head"><div><p class="daily-kicker">Daily rotation</p><h2>Small joys, every day</h2><span class="daily-timer">Items refresh in ${formatDuration(resetAt - Date.now())}</span></div><div class="daily-reset">Eastern Time<br><strong>${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date())}</strong></div></div><div class="daily-reward"><div><strong>Daily Sakura coins</strong><small>Claim 400 coins once every 24 hours after claiming.</small></div><button class="daily-claim" ${claimReady ? "" : "disabled"}>${claimReady ? "Claim 400 coins" : `Available in ${formatDuration(24 * 60 * 60 * 1000 - (Date.now() - claimAt))}`}</button></div><p class="daily-label">Today's items</p><div class="daily-items"></div>`;
		const items = panel.querySelector(".daily-items"); getRotatedItems("daily").forEach((item) => items.appendChild(renderProductCard(item)));
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
		if (["Weekly", "Monthly", "Seasonal", "Permanent"].includes(state.filter)) {
			getShopItems(state.filter.toLowerCase()).forEach(item => grid.appendChild(renderProductCard(item)));
			return;
		}
		getShopItems("all").filter(item => state.filter === "All" || item.type === state.filter).forEach(item => grid.appendChild(renderProductCard(item)));
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
