const equipmentFields = ['weapon', 'armor', 'helmet', 'shield', 'bracelet', 'earrings', 'necklace', 'shoes', 'talisman', 'glove', 'sash', 'pet', 'alchemy'];
const progressFields = ['horse', 'biologist', 'mainFarm', 'accounts'];
const equipmentLabels = { weapon: 'Armă', armor: 'Armură', helmet: 'Coif', shield: 'Scut', bracelet: 'Brățară', earrings: 'Cercei', necklace: 'Colier', shoes: 'Papuci', talisman: 'Talisman', glove: 'Mănușă', sash: 'Eșarfă', pet: 'Pet', alchemy: 'Alchimie' };
const progressLabels = { horse: 'Cal', biologist: 'Biolog', mainFarm: 'Farm principal', accounts: 'Conturi secundare' };
const raceLabels = { warrior: 'Warrior', ninja: 'Ninja', sura: 'Sura', shaman: 'Șaman', lycan: 'Lycan' };

const form = document.querySelector('#progress-form');
const identity = document.querySelector('#profile-identity');
const loginRequired = document.querySelector('#login-required');
const saveStatus = document.querySelector('#save-status');
const adminPanel = document.querySelector('#admin-panel');
const playersList = document.querySelector('#players-list');
const adminSummary = document.querySelector('#admin-summary');

document.querySelector('.menu-button')?.addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  document.querySelector('.progress-nav')?.classList.toggle('open', open);
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function setField(name, value) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value ?? '';
}

function populateForm(profile) {
  if (!profile) return;
  ['characterName', 'race', 'level', 'championLevel', 'tier', 'notes'].forEach(field => setField(field, profile[field]));
  equipmentFields.forEach(field => setField(field, profile.equipment?.[field]));
  progressFields.forEach(field => setField(field, profile.progress?.[field]));
}

function readForm() {
  const data = new FormData(form);
  return {
    characterName: data.get('characterName'),
    race: data.get('race'),
    level: Number(data.get('level')),
    championLevel: Number(data.get('championLevel')),
    tier: Number(data.get('tier')),
    equipment: Object.fromEntries(equipmentFields.map(field => [field, data.get(field)])),
    progress: Object.fromEntries(progressFields.map(field => [field, data.get(field)])),
    notes: data.get('notes')
  };
}

function renderIdentity(user, progress) {
  const avatar = user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="">` : '<span class="avatar-fallback">D</span>';
  const profile = progress?.profile;
  identity.innerHTML = `${avatar}<div><small>CONT DISCORD</small><strong>${escapeHtml(user.username)}</strong><span>${profile ? `${escapeHtml(profile.characterName)} · Tier ${profile.tier}` : 'Profil necompletat'}</span></div>`;
}

function renderPlayers(players) {
  adminSummary.innerHTML = `<article><strong>${players.length}</strong><span>profiluri salvate</span></article><article><strong>${players.filter(player => player.profile?.tier === 3).length}</strong><span>jucători Tier III</span></article><article><strong>${players.filter(player => player.profile?.championLevel > 0).length}</strong><span>nivel Campion</span></article>`;
  if (!players.length) {
    playersList.innerHTML = '<p class="empty-state">Niciun membru nu și-a salvat încă progresul.</p>';
    return;
  }

  playersList.innerHTML = players.map(player => {
    const profile = player.profile || {};
    const equipment = Object.entries(profile.equipment || {}).filter(([, value]) => value);
    const progression = Object.entries(profile.progress || {}).filter(([, value]) => value);
    const avatar = player.discord_avatar ? `<img src="${escapeHtml(player.discord_avatar)}" alt="">` : '<span class="avatar-fallback">D</span>';
    return `<details class="player-card">
      <summary>${avatar}<div><strong>${escapeHtml(profile.characterName || 'Personaj fără nume')}</strong><span>${escapeHtml(player.discord_username)} · ${escapeHtml(raceLabels[profile.race] || profile.race || 'Rasă nesetată')}</span></div><div class="player-level"><b>Tier ${Number(profile.tier) || 1}</b><span>Lv. ${Number(profile.level) || 1}${profile.championLevel ? ` · C${Number(profile.championLevel)}` : ''}</span></div><i>＋</i></summary>
      <div class="player-details">
        <section><h3>Echipament</h3>${equipment.length ? `<dl>${equipment.map(([key, value]) => `<div><dt>${escapeHtml(equipmentLabels[key] || key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>` : '<p>Nicio informație completată.</p>'}</section>
        <section><h3>Progres</h3>${progression.length ? `<dl>${progression.map(([key, value]) => `<div><dt>${escapeHtml(progressLabels[key] || key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>` : '<p>Nicio informație completată.</p>'}${profile.notes ? `<div class="admin-notes"><strong>Observații</strong><p>${escapeHtml(profile.notes)}</p></div>` : ''}</section>
      </div><footer>Actualizat: ${new Date(player.updated_at).toLocaleString('ro-RO')}</footer>
    </details>`;
  }).join('');
}

async function loadAdminPlayers() {
  playersList.innerHTML = '<p class="empty-state">Se încarcă profilurile…</p>';
  const response = await fetch('/api/progress/all', { credentials: 'same-origin' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Lista nu a putut fi încărcată.');
  renderPlayers(payload.players);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  saveStatus.textContent = 'Salvăm progresul…';
  saveStatus.className = '';
  try {
    const response = await fetch('/api/progress/me', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readForm())
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Salvarea a eșuat.');
    saveStatus.textContent = 'Progres salvat cu succes.';
    saveStatus.className = 'success';
    const me = await fetch('/api/me', { credentials: 'same-origin' }).then(result => result.json());
    renderIdentity(me.user, payload.progress);
    if (me.canAdminProgress) await loadAdminPlayers();
  } catch (error) {
    saveStatus.textContent = error.message;
    saveStatus.className = 'error';
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#refresh-admin')?.addEventListener('click', () => loadAdminPlayers().catch(error => {
  playersList.innerHTML = `<p class="empty-state error">${escapeHtml(error.message)}</p>`;
}));

async function initializeProgressPage() {
  try {
    const me = await fetch('/api/me', { credentials: 'same-origin' }).then(response => response.json());
    if (!me.authenticated) {
      identity.hidden = true;
      loginRequired.hidden = false;
      return;
    }

    const response = await fetch('/api/progress/me', { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Profilul nu a putut fi încărcat.');
    renderIdentity(me.user, payload.progress);
    populateForm(payload.progress?.profile);
    form.hidden = false;

    if (me.canAdminProgress) {
      adminPanel.hidden = false;
      await loadAdminPlayers();
    }
  } catch (error) {
    identity.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

initializeProgressPage();
