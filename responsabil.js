const responsibleMenu = document.querySelector('.menu-button');
const responsibleNav = document.querySelector('.progress-nav');
responsibleMenu?.addEventListener('click', () => {
  const open = responsibleNav.classList.toggle('open');
  responsibleMenu.setAttribute('aria-expanded', String(open));
});

const announcementManager = document.querySelector('#announcement-manager');
const announcementForm = document.querySelector('#announcement-form');
const announcementId = document.querySelector('#announcement-id');
const announcementTier = document.querySelector('#announcement-tier');
const announcementTitle = document.querySelector('#announcement-title');
const announcementMessage = document.querySelector('#announcement-message');
const announcementList = document.querySelector('#announcement-list');
const announcementStatus = document.querySelector('#announcement-status');
const announcementCancel = document.querySelector('#announcement-cancel');
let managedAnnouncements = [];

function responsibleEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function announcementFeedback(message = '', type = '') {
  announcementStatus.textContent = message;
  announcementStatus.className = `weekly-status ${type}`.trim();
}

function resetAnnouncementForm() {
  announcementId.value = '';
  announcementTitle.value = '';
  announcementMessage.value = '';
  announcementTier.disabled = false;
  announcementCancel.hidden = true;
  announcementForm.querySelector('button[type="submit"]').textContent = 'Publică anunțul';
}

function renderAnnouncements() {
  if (!managedAnnouncements.length) {
    announcementList.innerHTML = '<p>Nu există anunțuri publicate.</p>';
    return;
  }
  announcementList.innerHTML = managedAnnouncements.map(item => `
    <article class="announcement-card ${item.active ? '' : 'is-inactive'}">
      <span class="announcement-tier">TIER ${item.tier}</span>
      <div><h3>${responsibleEscape(item.title)}</h3><p>${responsibleEscape(item.message)}</p><small>${item.active ? 'ACTIV' : 'ASCUNS'} · ${responsibleEscape(item.author_name)} · ${new Date(item.updated_at).toLocaleString('ro-RO')}</small></div>
      <div class="announcement-card-actions"><button type="button" data-edit-announcement="${item.id}">Editează</button><button type="button" data-toggle="${item.id}">${item.active ? 'Ascunde' : 'Activează'}</button><button type="button" data-delete="${item.id}">Șterge</button></div>
    </article>`).join('');
}

async function loadAnnouncements() {
  const response = await fetch('/api/announcements/manage', { credentials: 'same-origin' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Anunțurile nu au putut fi încărcate.');
  managedAnnouncements = payload.announcements || [];
  renderAnnouncements();
}

announcementForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const id = announcementId.value;
  const body = { tier: Number(announcementTier.value), title: announcementTitle.value, message: announcementMessage.value };
  const button = announcementForm.querySelector('button[type="submit"]');
  button.disabled = true;
  announcementFeedback(id ? 'Se salvează anunțul…' : 'Se publică anunțul…');
  try {
    const response = await fetch(id ? `/api/announcements/${id}` : '/api/announcements', {
      method: id ? 'PUT' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Anunțul nu a putut fi salvat.');
    resetAnnouncementForm();
    await loadAnnouncements();
    announcementFeedback('Anunț salvat și actualizat pe pagina principală.', 'success');
  } catch (error) {
    announcementFeedback(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

announcementCancel?.addEventListener('click', resetAnnouncementForm);

announcementList?.addEventListener('click', async event => {
  const edit = event.target.closest('[data-edit-announcement]');
  const toggle = event.target.closest('[data-toggle]');
  const remove = event.target.closest('[data-delete]');
  const id = edit?.dataset.editAnnouncement || toggle?.dataset.toggle || remove?.dataset.delete;
  const item = managedAnnouncements.find(announcement => String(announcement.id) === String(id));
  if (!item) return;
  if (edit) {
    announcementId.value = item.id;
    announcementTier.value = item.tier;
    announcementTitle.value = item.title;
    announcementMessage.value = item.message;
    announcementTier.disabled = true;
    announcementCancel.hidden = false;
    announcementForm.querySelector('button[type="submit"]').textContent = 'Salvează modificarea';
    announcementTitle.focus();
    return;
  }
  try {
    if (toggle) {
      const response = await fetch(`/api/announcements/${item.id}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) });
      if (!response.ok) throw new Error((await response.json()).error || 'Starea nu a putut fi schimbată.');
    }
    if (remove) {
      if (!confirm('Ștergi definitiv acest anunț?')) return;
      const response = await fetch(`/api/announcements/${item.id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) throw new Error((await response.json()).error || 'Anunțul nu a putut fi șters.');
    }
    await loadAnnouncements();
  } catch (error) {
    announcementFeedback(error.message, 'error');
  }
});

async function initializeResponsiblePage() {
  const me = await fetch('/api/me', { credentials: 'same-origin' }).then(response => response.json());
  const tiers = me.managedProgressTiers || [];
  if (!me.authenticated || !tiers.length) {
    document.querySelector('#responsible-denied').hidden = false;
    document.querySelector('#responsible-scope').innerHTML = '<span>FĂRĂ ACCES</span>';
    return;
  }
  document.querySelector('#responsible-scope').innerHTML = me.canAdminProgress
    ? '<span>ADMIN · TOATE TIERURILE</span>'
    : tiers.map(tier => `<span>RESPONSABIL TIER ${tier}</span>`).join('');
  announcementTier.innerHTML = tiers.map(tier => `<option value="${tier}">Tier ${tier}</option>`).join('');
  announcementManager.hidden = false;
  await loadAnnouncements();
}

initializeResponsiblePage().catch(error => {
  document.querySelector('#responsible-denied').hidden = false;
  announcementFeedback(error.message, 'error');
});
