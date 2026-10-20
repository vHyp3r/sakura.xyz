(() => {
  const packId = window.packId;
  if (!packId) return;

  const saveButton = document.querySelector('#savePackButton');
  const likeButton = document.querySelector('#likePackButton');
  const authorButton = document.querySelector('#authorPackButton');
  const commentButton = document.querySelector('#commentPackButton');
  const superReactButton = document.querySelector('#superReactButton');
  const status = document.querySelector('#packActionStatus');
  const comments = document.querySelector('#commentList');
  const commentCount = document.querySelector('#commentCount');
  const commentForm = document.querySelector('#commentForm');
  const commentBody = document.querySelector('#commentBody');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));

  const setStatus = (message) => {
    status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => { status.textContent = ''; }, 3500);
  };

  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to complete that action.');
    return result;
  };

  const loadAccount = async () => {
    const response = await fetch('/api/account/me', { cache: 'no-store' });
    const result = await response.json();
    return result.authenticated ? result.account : null;
  };

  const renderComments = (items) => {
    comments.replaceChildren();
    commentCount.textContent = String(items.length);
    if (!items.length) {
      comments.textContent = 'No comments yet. Start the conversation.';
      comments.className = 'pack-comments-empty';
      return;
    }
    comments.className = '';
    items.forEach((comment) => {
      const element = document.createElement('article');
      element.className = 'pack-comment';
      element.innerHTML = `<strong>${escapeHtml(comment.username)}</strong><time>${new Date(comment.createdAt).toLocaleDateString()}</time><p>${escapeHtml(comment.body)}</p>`;
      comments.appendChild(element);
    });
  };

  const loadComments = async () => {
    const result = await request(`/api/packs/${packId}/comments`);
    renderComments(result.comments || []);
  };

  const requireAction = async (action) => {
    try {
      const result = await action();
      if (result.saved !== undefined) saveButton.textContent = result.saved ? '✓ SAVED TO LIBRARY' : '＋ ADD TO LIBRARY';
      if (result.liked !== undefined) {
        likeButton.textContent = result.liked ? '♥' : '♡';
        document.querySelector('#packLikes').textContent = result.likes;
      }
      if (result.reacted !== undefined) superReactButton.textContent = result.reacted ? '⚡' : '⌯';
      return result;
    } catch (error) {
      setStatus(error.message);
      return null;
    }
  };

  saveButton.onclick = () => requireAction(() => request(`/api/packs/${packId}/library`, { method: 'POST' }));
  likeButton.onclick = () => requireAction(() => request(`/api/packs/${packId}/like`, { method: 'POST' }));
  superReactButton.onclick = () => requireAction(() => request(`/api/packs/${packId}/super-react`, { method: 'POST' }));
  authorButton.onclick = () => {
    const author = document.querySelector('.detail-creator strong')?.textContent.trim();
    if (author) window.location.href = `/search?q=${encodeURIComponent(author)}`;
  };
  commentButton.onclick = () => {
    document.querySelector('#packComments').scrollIntoView({ behavior: 'smooth' });
    commentBody.focus();
  };
  commentForm.onsubmit = async (event) => {
    event.preventDefault();
    const body = commentBody.value.trim();
    if (!body) return;
    const result = await requireAction(() => request(`/api/packs/${packId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }));
    if (result?.comment) {
      commentBody.value = '';
      loadComments().catch((error) => setStatus(error.message));
    }
  };

  request(`/api/packs/${packId}/view`, { method: 'POST' })
    .then((result) => { document.querySelector('#packViews').textContent = Number(result.views).toLocaleString(); })
    .catch(() => {});
  loadComments().catch((error) => setStatus(error.message));

  loadAccount().then((account) => {
    if (!account) return;
    saveButton.textContent = account.savedPacks?.includes(packId) ? '✓ SAVED TO LIBRARY' : '＋ ADD TO LIBRARY';
    likeButton.textContent = account.likedPacks?.includes(packId) ? '♥' : '♡';
  }).catch(() => {});
})();
