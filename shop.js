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

	const state = { balance: Number(localStorage.getItem("sakura-coins") || 1200), owned: JSON.parse(localStorage.getItem("sakura-owned") || "[]"), filter: "All" };
	const style = document.createElement("style");
	style.textContent = `
		.sakura-shop{max-width:980px;margin:2rem auto;padding:2rem;font:16px system-ui,sans-serif;color:#35283d;background:#fff8fc;border-radius:24px;box-shadow:0 12px 40px #7f52631c}.sakura-shop h1{margin:0 0 .25rem;font-size:2rem}.shop-sub{color:#8a7184;margin-top:0}.shop-bar{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:1.5rem 0}.shop-tabs button{border:0;background:#f4e6f0;color:#76556b;padding:.65rem 1rem;border-radius:999px;cursor:pointer}.shop-tabs button.active{background:#d86c9b;color:white}.shop-balance{margin-left:auto;background:#fff;border:1px solid #f0d9e5;padding:.65rem 1rem;border-radius:999px;font-weight:700}.shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.shop-card{background:white;border:1px solid #f0dce7;border-radius:18px;overflow:hidden}.shop-art{height:130px;display:grid;place-items:center;font-size:4rem}.shop-card-body{padding:1rem}.shop-card h3{margin:.2rem 0}.shop-type{font-size:.8rem;color:#987b91}.shop-buy{width:100%;margin-top:.8rem;padding:.7rem;border:0;border-radius:10px;background:#35283d;color:white;font-weight:700;cursor:pointer}.shop-buy:disabled{background:#d7ccd5;cursor:not-allowed}.shop-message{min-height:1.3em;color:#b34c78;font-size:.9rem}`;
	document.head.appendChild(style);

	const root = document.createElement("section");
	root.className = "sakura-shop";
	root.innerHTML = `<h1>🌸 Sakura Shop</h1><p class="shop-sub">Make your space feel like yours.</p><div class="shop-bar"><div class="shop-tabs"></div><div class="shop-balance"></div></div><div class="shop-message" aria-live="polite"></div><div class="shop-grid"></div>`;
	(document.querySelector("#shop") || document.body).appendChild(root);

	const tabs = ["All", "Avatar cosmetics", "Backgrounds", "Themes"];
	const tabsEl = root.querySelector(".shop-tabs");
	tabs.forEach(tab => { const button = document.createElement("button"); button.textContent = tab; button.onclick = () => { state.filter = tab; render(); }; tabsEl.appendChild(button); });

	function render() {
		root.querySelector(".shop-balance").textContent = `🪙 ${state.balance} coins`;
		tabsEl.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.textContent === state.filter));
		const grid = root.querySelector(".shop-grid"); grid.replaceChildren();
		products.filter(item => state.filter === "All" || item.type === state.filter).forEach(item => {
			const owned = state.owned.includes(item.id), card = document.createElement("article"); card.className = "shop-card";
			card.innerHTML = `<div class="shop-art" style="background:${item.color}">${item.icon}</div><div class="shop-card-body"><span class="shop-type">${item.type}</span><h3>${item.name}</h3><strong>🪙 ${item.price}</strong><button class="shop-buy" ${owned ? "disabled" : ""}>${owned ? "Owned ✓" : "Buy now"}</button></div>`;
			if (!owned) card.querySelector("button").onclick = () => buy(item);
			grid.appendChild(card);
		});
	}
	function buy(item) {
		const message = root.querySelector(".shop-message");
		if (state.balance < item.price) { message.textContent = "You need more coins for this item."; return; }
		state.balance -= item.price; state.owned.push(item.id); localStorage.setItem("sakura-coins", state.balance); localStorage.setItem("sakura-owned", JSON.stringify(state.owned)); message.textContent = `${item.name} added to your collection!`; render();
	}
	render();
})();
