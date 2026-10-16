(() => {
  const tg = window.Telegram?.WebApp;
  tg?.ready();
  tg?.expand();

  const state = { creators: [], filter: 'all', query: '', tab: 'home' };
  const grid = document.querySelector('#creator-grid');
  const featured = document.querySelector('#featured-list');
  const empty = document.querySelector('#empty-state');
  const dialog = document.querySelector('#creator-dialog');
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const assetUrl = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' || (url.origin === location.origin && !String(value).startsWith('//')) ? url.href : '';
    } catch { return ''; }
  };
  const initials = (name) => String(name || 'M').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();

  function visibleCreators() {
    const q = state.query.trim().toLowerCase();
    const matching = state.creators.filter((creator) => {
      const tags = (creator.tags || []).map((tag) => String(tag).toLowerCase());
      const matchesFilter = state.filter === 'all' ||
        (state.filter === 'hot' && creator.hot) ||
        (state.filter === 'verified' && creator.verified) ||
        tags.some((tag) => tag.includes(state.filter));
      const matchesQuery = !q || `${creator.name || ''} ${creator.bio || ''} ${tags.join(' ')}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    return state.tab === 'trending'
      ? matching.sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)) || Number(b.followers || 0) - Number(a.followers || 0))
      : matching;
  }

  function showProfile(creator) {
    const items = (creator.items || []).map((item) => {
      const previewUrl = assetUrl(item.preview_url);
      const media = previewUrl
        ? (item.preview_media_type === 'video'
          ? `<video class="item-preview" src="${safe(previewUrl)}" controls muted playsinline preload="metadata"></video>`
          : `<img class="item-preview" src="${safe(previewUrl)}" alt="Preview for ${safe(item.title || 'creator content')}" loading="lazy" />`)
        : '';
      const details = `<span class="item-details"><b>${safe(item.title || 'Private content')}</b><small>${safe(item.description || '')}</small></span>`;
      return item.content_code
        ? `<article class="content-tile">${media}${details}<button class="content-buy" data-item-code="${safe(item.content_code)}">🔒 ${safe(item.price_label || 'View unlock options')} · Purchase in Telegram →</button></article>`
        : `<div class="content-tile">${media}${details}</div>`;
    }).join('');
    const preview = assetUrl(creator.preview_image);
    document.querySelector('#dialog-content').innerHTML = `
      <div class="dialog-cover">${preview ? `<img class="cover-photo" src="${safe(preview)}" alt="" />` : ''}<span class="cover-initial">${safe(initials(creator.name))}</span></div>
      <div class="dialog-content">
        <span class="eyebrow">${creator.verified ? '✓ VERIFIED CREATOR' : 'MEET THE CREATOR'}</span>
        <h2>${safe(creator.name)}</h2>
        <div class="card-tags">${(creator.tags || []).map((tag) => `<span class="tag">${safe(tag)}</span>`).join('')}</div>
        <p>${safe(creator.bio || 'More about this creator is coming soon.')}</p>
        <div class="dialog-stats"><span>✦ ${Number(creator.followers || 0).toLocaleString()} followers</span><span>▣ ${(creator.items || []).length} items</span></div>
        ${items ? `<div class="dialog-items">${items}</div>` : '<p class="muted">New content is being prepared.</p>'}
      </div>`;
    dialog.showModal();
  }

  function card(creator) {
    const tags = (creator.tags || []).slice(0, 3).map((tag) => `<span class="tag">${safe(tag)}</span>`).join('');
    const badge = creator.hot ? '🔥 TRENDING' : creator.featured ? '✦ FEATURED' : 'MEET THE CREATOR';
    const preview = assetUrl(creator.preview_image);
    return `<article class="creator-card">
      <button class="cover-button" data-profile="${safe(creator.id)}" aria-label="View ${safe(creator.name)} profile">
        <div class="card-cover">${preview ? `<img class="cover-photo" src="${safe(preview)}" alt="" loading="lazy" />` : ''}<span class="cover-badge">${badge}</span><span class="cover-initial">${safe(initials(creator.name))}</span><span class="cover-play">↗</span></div>
      </button>
      <div class="card-body"><h3 class="creator-title">${safe(creator.name)} ${creator.verified ? '<span class="verified" title="Verified">✓</span>' : ''}</h3>
      <div class="card-tags">${tags}</div>
      <div class="card-meta"><span>✦ ${Number(creator.followers || 0).toLocaleString()}</span><button class="text-button" data-profile="${safe(creator.id)}">View profile　→</button></div></div>
    </article>`;
  }

  function render() {
    const people = visibleCreators();
    const showHome = state.tab === 'home' || state.tab === 'trending';
    document.querySelector('#main-content').classList.toggle('hidden', !showHome);
    document.querySelector('#earn-screen').classList.toggle('hidden', state.tab !== 'earn');
    document.querySelector('#profile-screen').classList.toggle('hidden', state.tab !== 'profile');
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.tab === state.tab));
    document.querySelector('#directory-title').textContent = state.tab === 'trending' ? 'Trending now' : 'Creator directory';
    document.querySelector('#result-count').textContent = people.length ? `${people.length} creator${people.length === 1 ? '' : 's'}` : '';
    grid.innerHTML = people.map(card).join('');
    const highlights = state.creators.filter((person) => person.featured);
    featured.innerHTML = highlights.map((person) => `<button class="featured-person" data-profile="${safe(person.id)}"><span class="featured-avatar"><span>${safe(initials(person.name))}</span></span><span>${safe(person.name)}</span></button>`).join('');
    document.querySelector('#featured-section').classList.toggle('hidden', !highlights.length || state.tab === 'trending');
    const noMatch = !people.length;
    empty.classList.toggle('hidden', !noMatch);
    grid.classList.toggle('hidden', noMatch);
    document.querySelector('#empty-title').textContent = state.creators.length && state.query ? 'No matches yet' : 'Your next favorite is on the way';
    document.querySelector('#empty-copy').textContent = state.creators.length && state.query ? 'Try another name or category.' : 'New creator profiles will appear here as they’re published.';
  }

  function sendBotAction(payload) {
    if (tg?.sendData) {
      tg.sendData(JSON.stringify(payload));
      return;
    }
    toast('Open this page inside Telegram to continue.');
  }

  function toast(message) {
    let node = document.querySelector('.toast');
    if (!node) { node = document.createElement('div'); node.className = 'toast'; document.body.append(node); }
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
  }

  document.querySelector('#search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
  document.querySelector('#filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip === button));
    render();
  });
  document.body.addEventListener('click', (event) => {
    const profileButton = event.target.closest('[data-profile]');
    if (profileButton) {
      const creator = state.creators.find((person) => String(person.id) === profileButton.dataset.profile);
      if (creator) showProfile(creator);
      return;
    }
    const itemButton = event.target.closest('[data-item-code]');
    if (itemButton) { sendBotAction({ doc: 'meet_models', action: 'open_item', content_code: itemButton.dataset.itemCode }); return; }
    const tab = event.target.closest('[data-tab]');
    if (tab) { state.tab = tab.dataset.tab; render(); return; }
    const action = event.target.closest('[data-bot-action]');
    if (action) { sendBotAction({ doc: 'meet_models', action: action.dataset.botAction }); return; }
    if (event.target.closest('[data-close-app]')) { tg?.close(); return; }
  });
  document.querySelector('#profile-shortcut').addEventListener('click', () => { state.tab = 'profile'; render(); });
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  const firstName = tg?.initDataUnsafe?.user?.first_name;
  if (firstName) document.querySelector('#profile-name').textContent = `, ${firstName}`;
  const params = new URLSearchParams(location.search);
  const startCreator = params.get('creator');

  fetch('./data/creators.json', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('Feed unavailable'); return response.json(); })
    .then((data) => {
      state.creators = Array.isArray(data) ? data.filter((creator) => creator && creator.id && creator.name) : [];
      render();
      if (startCreator) {
        const creator = state.creators.find((person) => String(person.id) === startCreator);
        if (creator) showProfile(creator);
      }
    })
    .catch(() => {
      document.querySelector('#empty-title').textContent = 'Could not load the directory';
      document.querySelector('#empty-copy').textContent = 'Please try again in a moment.';
      render();
    });
})();
