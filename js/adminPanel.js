const state = { summary: null, collections: [], activeCollection: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
	return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showToast(message) {
	const toast = $('#toast');
	toast.textContent = message;
	toast.classList.add('is-visible');
	window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function setConnectionState(summary) {
	const status = summary?.status || {};
	const connected = Boolean(status.connected);
	const kind = status.kind || 'database';
	$('#dataSource').textContent = connected ? kind === 'mongodb' ? 'MongoDB' : 'Firebase' : 'Offline';
	$('#dataSourceDetail').textContent = connected ? 'Connected and responding' : 'No live connection';
	$('#databaseKind').textContent = connected ? `${kind === 'mongodb' ? 'MongoDB' : 'Firebase'} data service` : status.message || 'Not configured';
	$('#databaseStatus').textContent = connected ? 'Online' : 'Offline';
	$('#databaseBullet').classList.toggle('off', !connected);
	$('#healthPill').textContent = connected ? 'All systems normal' : 'Needs attention';
	const notice = $('#connectionNotice');
	notice.hidden = connected;
	if (!connected) notice.textContent = status.message || 'No database connection is configured. Site tools remain available, but collection data cannot be loaded.';
}

function renderCollections() {
	const collections = state.collections;
	$('#collectionCount').textContent = collections.length;
	$('#browserCount').textContent = collections.length;
	const empty = '<div class="empty-state"><span class="empty-icon">◌</span><strong>No collections found</strong><p>Connect Firebase or MongoDB to inspect site data.</p></div>';
	const rows = collections.length ? collections.slice(0, 5).map((collection) => `<div class="collection-row"><span class="collection-symbol">▦</span><span><strong>${escapeHtml(collection.id)}</strong><small>Database collection</small></span><span class="collection-count">${collection.documentCount ?? 0}</span></div>`).join('') : empty;
	$('#collectionList').innerHTML = rows;
	$('#collectionBrowser').innerHTML = collections.length ? collections.map((collection) => `<button class="browser-item" data-collection="${escapeHtml(collection.id)}"><strong>${escapeHtml(collection.id)}</strong><span>${collection.documentCount ?? 0}</span></button>`).join('') : empty;
	$$('.browser-item').forEach((item) => item.addEventListener('click', () => selectCollection(item.dataset.collection)));
}

async function loadSummary() {
	$('#lastUpdated').textContent = 'Refreshing...';
	try {
		const response = await fetch('/api/admin/summary');
		if (response.status === 401) {
			window.location.href = '/admin/login?returnTo=/admin';
			return;
		}
		if (!response.ok) throw new Error('Summary unavailable');
		state.summary = await response.json();
	} catch (error) {
		state.summary = { status: { connected: false, message: error.message === 'Summary unavailable' ? 'Admin authentication is required. Sign in again to continue.' : 'The admin API is unavailable. Start the server to view live data.' }, collections: [], totalDocuments: 0 };
	}
	state.collections = state.summary.collections || [];
	$('#totalDocuments').textContent = (state.summary.totalDocuments || 0).toLocaleString();
	setConnectionState(state.summary);
	renderCollections();
	$('#lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

async function selectCollection(name) {
	state.activeCollection = name;
	$$('.browser-item').forEach((item) => item.classList.toggle('is-active', item.dataset.collection === name));
	$('#documentTitle').textContent = name;
	$('#documentTable').innerHTML = '<div class="loading-row">Loading documents</div>';
	try {
		const limit = $('#documentLimit').value;
		const response = await fetch(`/api/admin/collections/${encodeURIComponent(name)}?limit=${limit}`);
		if (response.status === 401) {
			window.location.href = '/admin/login?returnTo=/admin';
			return;
		}
		if (!response.ok) throw new Error('Documents unavailable');
		const result = await response.json();
		$('#documentCount').textContent = `${result.count} shown`;
		const documents = result.documents || [];
		if (!documents.length) {
			$('#documentTable').innerHTML = '<div class="empty-state"><span class="empty-icon">◌</span><strong>Collection is empty</strong><p>No documents were returned.</p></div>';
			return;
		}
		const keys = [...new Set(documents.flatMap((document) => Object.keys(document)))].slice(0, 5);
		$('#documentTable').innerHTML = `<table class="document-table"><thead><tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join('')}</tr></thead><tbody>${documents.map((document) => `<tr>${keys.map((key) => `<td title="${escapeHtml(JSON.stringify(document[key] ?? ''))}">${escapeHtml(typeof document[key] === 'object' ? JSON.stringify(document[key]) : document[key] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
	} catch (error) {
		$('#documentCount').textContent = 'Unavailable';
		$('#documentTable').innerHTML = `<div class="empty-state"><span class="empty-icon">!</span><strong>Could not load documents</strong><p>${escapeHtml(error.message)}</p></div>`;
	}
}

function switchView(view, updateUrl = true) {
	$$('.nav-item[data-view]').forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
	$$('.view-panel').forEach((panel) => panel.classList.toggle('is-visible', panel.dataset.panel === view));
	$('#viewCrumb').textContent = view[0].toUpperCase() + view.slice(1);
	$('#pageTitle').textContent = view === 'overview' ? 'Good morning, admin.' : view[0].toUpperCase() + view.slice(1);
	if (updateUrl && window.location.pathname !== `/admin/${view}`) window.history.pushState({}, '', `/admin/${view}`);
}

function setInitialView() {
	const routeView = window.location.pathname.split('/').filter(Boolean).pop();
	if (['collections', 'activity'].includes(routeView)) switchView(routeView, false);
	else switchView('overview', false);
}

function setupInteractions() {
	$$('.nav-item[data-view]').forEach((item) => item.addEventListener('click', () => switchView(item.dataset.view)));
	$$('[data-go="collections"]').forEach((item) => item.addEventListener('click', () => switchView('collections')));
	$('#refreshButton').addEventListener('click', () => { loadSummary(); showToast('Dashboard refreshed'); });
	$('#refreshCta').addEventListener('click', () => { loadSummary(); showToast('Dashboard refreshed'); });
	$('#reloadCollections').addEventListener('click', () => { loadSummary(); showToast('Collections reloaded'); });
	$('#documentLimit').addEventListener('change', () => { if (state.activeCollection) selectCollection(state.activeCollection); });
	$('#globalSearch').addEventListener('input', (event) => {
		const query = event.target.value.toLowerCase();
		$$('.browser-item').forEach((item) => { item.hidden = !item.dataset.collection.toLowerCase().includes(query); });
	});
	window.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); $('#globalSearch').focus(); } });
}

setupInteractions();
setInitialView();
window.addEventListener('popstate', setInitialView);
loadSummary();
