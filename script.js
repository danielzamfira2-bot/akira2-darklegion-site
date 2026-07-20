const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

function announcementEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function loadTierAnnouncements() {
  const panel = document.querySelector('#tier-announcements');
  if (!panel) return;
  try {
    const response = await fetch('/api/announcements/me', { credentials: 'same-origin' });
    if (response.status === 401) return;
    const payload = await response.json();
    if (!response.ok || !payload.announcements?.length) return;
    document.querySelector('#tier-announcement-title').textContent = `Anunțuri pentru Tier ${payload.tier}`;
    document.querySelector('#tier-announcement-badge').textContent = `TIER ${payload.tier}`;
    document.querySelector('#tier-announcement-list').innerHTML = payload.announcements.map(item => `
      <article><h3>${announcementEscape(item.title)}</h3><p>${announcementEscape(item.message)}</p><footer><span>${announcementEscape(item.author_name)}</span><time>${new Date(item.updated_at).toLocaleString('ro-RO')}</time></footer></article>`).join('');
    panel.hidden = false;
  } catch {
    panel.hidden = true;
  }
}

loadTierAnnouncements();
