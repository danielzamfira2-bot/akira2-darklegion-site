const equipmentFields = ['weapon', 'armor', 'helmet', 'shield', 'bracelet', 'earrings', 'necklace', 'shoes', 'talisman', 'glove', 'sash', 'pet'];
const alchemyFields = ['diamond', 'ruby', 'jade', 'sapphire', 'garnet', 'onyx', 'amethyst'];
const progressFields = ['horse', 'biologist', 'mainFarm', 'accounts'];
const equipmentLabels = { weapon: 'Armă', armor: 'Armură', helmet: 'Coif', shield: 'Scut', bracelet: 'Brățară', earrings: 'Cercei', necklace: 'Colier', shoes: 'Papuci', talisman: 'Talisman', glove: 'Mănușă', sash: 'Eșarfă', pet: 'Pet' };
const alchemyLabels = { diamond: 'Diamant', ruby: 'Rubin', jade: 'Jad', sapphire: 'Safir', garnet: 'Granat', onyx: 'Onyx', amethyst: 'Ametist' };
const progressLabels = { horse: 'Cal', biologist: 'Biolog', mainFarm: 'Farm principal', accounts: 'Conturi secundare' };
const raceLabels = { warrior: 'Warrior', ninja: 'Ninja', sura: 'Sura', shaman: 'Șaman', lycan: 'Lycan' };

const form = document.querySelector('#progress-form');
const identity = document.querySelector('#profile-identity');
const loginRequired = document.querySelector('#login-required');
const saveStatus = document.querySelector('#save-status');
const adminPanel = document.querySelector('#admin-panel');
const playersList = document.querySelector('#players-list');
const adminSummary = document.querySelector('#admin-summary');
const picker = document.querySelector('#item-picker');
const pickerTitle = document.querySelector('#picker-title');
const pickerEyebrow = document.querySelector('#picker-eyebrow');
const equipmentImageEditor = document.querySelector('#equipment-image-editor');
const equipmentImageInput = document.querySelector('#equipment-image-input');
const equipmentImagePreview = document.querySelector('#equipment-image-preview');
const equipmentUploadStatus = document.querySelector('#equipment-upload-status');
const alchemyEditor = document.querySelector('#alchemy-editor');
const alchemyClarity = document.querySelector('#alchemy-clarity');
const alchemyLevel = document.querySelector('#alchemy-level');
const alchemyBaseValues = document.querySelector('#alchemy-base-values');
const alchemyPossibleValues = document.querySelector('#alchemy-possible-values');
const alchemySelectionStatus = document.querySelector('#alchemy-selection-status');
const alchemySource = document.querySelector('#alchemy-source');
const applySlotButton = document.querySelector('#apply-slot');
const clearSlotButton = document.querySelector('#clear-slot');
const alchemyCatalog = window.ALCHEMY_CATALOG;

let activeSlot = null;
let pendingEquipmentImage = null;
let pendingPreviewUrl = '';
let equipmentState = Object.fromEntries(equipmentFields.map(field => [field, emptySlot()]));
let alchemyState = Object.fromEntries(alchemyFields.map(field => [field, emptySlot()]));

document.querySelector('.menu-button')?.addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  document.querySelector('.progress-nav')?.classList.toggle('open', open);
});

function emptySlot() {
  return { itemId: '', name: '', bonuses: '', image: '', clarity: '', level: 0, selectedBonuses: [] };
}

function normalizeSlot(value) {
  if (typeof value === 'string') return { ...emptySlot(), name: value };
  return {
    itemId: value?.itemId || '',
    name: value?.name || '',
    bonuses: value?.bonuses || '',
    image: value?.image || '',
    clarity: value?.clarity || '',
    level: Number.isInteger(Number(value?.level)) ? Number(value.level) : 0,
    selectedBonuses: Array.isArray(value?.selectedBonuses) ? value.selectedBonuses.slice(0, 3) : []
  };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function safeItemImage(value = '') {
  return /^(?:(?:\/)?assets\/[a-z0-9_./-]+|\/api\/progress\/equipment\/\d+\/(?:weapon|armor|helmet|shield|bracelet|earrings|necklace|shoes|talisman|glove|sash|pet)\/image\?v=\d+)$/i.test(value) ? value : '';
}

function setField(name, value) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value ?? '';
}

function renderSlot(kind, field) {
  const state = kind === 'alchemy' ? alchemyState[field] : equipmentState[field];
  const button = document.querySelector(`[data-kind="${kind}"][data-slot="${field}"]`);
  if (!button) return;
  const image = safeItemImage(state.image);
  button.classList.toggle('filled', Boolean(state.name));
  button.querySelector('b').textContent = state.name || 'Slot liber';
  button.title = state.bonuses || state.name || 'Apasă pentru selectare';
  button.style.setProperty('--item-image', image ? `url("${image}")` : 'none');
  button.classList.toggle('has-image', Boolean(image));
}

function renderAllSlots() {
  equipmentFields.forEach(field => renderSlot('equipment', field));
  alchemyFields.forEach(field => renderSlot('alchemy', field));
}

function populateForm(profile) {
  if (!profile) return;
  ['characterName', 'race', 'level', 'championLevel', 'tier', 'notes'].forEach(field => setField(field, profile[field]));
  progressFields.forEach(field => setField(field, profile.progress?.[field]));
  equipmentState = Object.fromEntries(equipmentFields.map(field => {
    const slot = normalizeSlot(profile.equipment?.[field]);
    return safeItemImage(slot.image).startsWith('/api/progress/equipment/') ? [field, slot] : [field, emptySlot()];
  }));
  alchemyState = Object.fromEntries(alchemyFields.map(field => [field, normalizeSlot(profile.alchemy?.[field])]));
  if (profile.equipment?.alchemy && !alchemyFields.some(field => alchemyState[field].name)) {
    alchemyState.diamond = normalizeSlot(profile.equipment.alchemy);
  }
  renderAllSlots();
}

function readForm() {
  const data = new FormData(form);
  return {
    characterName: data.get('characterName'),
    race: data.get('race'),
    level: Number(data.get('level')),
    championLevel: Number(data.get('championLevel')),
    tier: Number(data.get('tier')),
    equipment: equipmentState,
    alchemy: alchemyState,
    progress: Object.fromEntries(progressFields.map(field => [field, data.get(field)])),
    notes: data.get('notes')
  };
}

function formatAlchemyValue(definition, values) {
  return `${definition.prefix || ''}${values[definition.valueKey]}${definition.suffix || ''}`;
}

function selectedAlchemyBonusIds() {
  return [...alchemyPossibleValues.querySelectorAll('input:checked')].map(input => input.value);
}

function updateAlchemySelectionState() {
  const selected = selectedAlchemyBonusIds();
  alchemySelectionStatus.textContent = `${selected.length} din 3 bonusuri selectate`;
  alchemyPossibleValues.querySelectorAll('input:not(:checked)').forEach(input => {
    input.disabled = selected.length >= 3;
  });
}

function renderAlchemyValues(selected = selectedAlchemyBonusIds()) {
  const stone = alchemyCatalog[activeSlot.field];
  const clarity = stone.clarities[alchemyClarity.value];
  const values = clarity.levels[Number(alchemyLevel.value)] || clarity.levels[0];
  alchemyBaseValues.innerHTML = stone.baseBonuses.map(definition => `<article><span>${escapeHtml(definition.label)}</span><b>${formatAlchemyValue(definition, values)}</b></article>`).join('');
  alchemyPossibleValues.innerHTML = stone.possibleBonuses.map(definition => `
    <label class="ruby-bonus-option">
      <input type="checkbox" value="${definition.id}" ${selected.includes(definition.id) ? 'checked' : ''}>
      <span><strong>${escapeHtml(definition.label)}</strong><b>${formatAlchemyValue(definition, values)}</b></span>
    </label>`).join('');
  alchemyPossibleValues.querySelectorAll('input').forEach(input => input.addEventListener('change', updateAlchemySelectionState));
  updateAlchemySelectionState();
}

function updateAlchemyLevels(preferredLevel = Number(alchemyLevel.value) || 0, selected = selectedAlchemyBonusIds()) {
  const stone = alchemyCatalog[activeSlot.field];
  const levels = stone.clarities[alchemyClarity.value].levels;
  alchemyLevel.innerHTML = levels.map((_, index) => `<option value="${index}">+${index}</option>`).join('');
  alchemyLevel.value = String(Math.min(preferredLevel, levels.length - 1));
  renderAlchemyValues(selected);
}

function configureAlchemyEditor(state) {
  const stone = alchemyCatalog[activeSlot.field];
  const clarityKey = stone.clarities[state.clarity] ? state.clarity : 'opac';
  alchemyClarity.innerHTML = Object.entries(stone.clarities).map(([key, clarity]) => `<option value="${key}">${clarity.label}</option>`).join('');
  alchemyClarity.value = clarityKey;
  alchemySource.href = stone.source;
  updateAlchemyLevels(state.level, state.selectedBonuses || []);
}

function alchemySlotFromSelection() {
  const stone = alchemyCatalog[activeSlot.field];
  const clarity = stone.clarities[alchemyClarity.value];
  const level = Number(alchemyLevel.value);
  const values = clarity.levels[level];
  const selectedBonuses = selectedAlchemyBonusIds();
  const baseText = stone.baseBonuses.map(definition => `${definition.label} ${formatAlchemyValue(definition, values)}`);
  const possibleText = stone.possibleBonuses
    .filter(definition => selectedBonuses.includes(definition.id))
    .map(definition => `${definition.label} ${formatAlchemyValue(definition, values)}`);
  return {
    ...alchemyState[activeSlot.field],
    itemId: stone.itemId,
    name: `${stone.name} (${clarity.label}) +${level}`,
    bonuses: [...baseText, ...possibleText].join(' · '),
    clarity: alchemyClarity.value,
    level,
    selectedBonuses
  };
}

function showEquipmentPreview(source = '') {
  if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
  pendingPreviewUrl = '';
  if (!source) {
    equipmentImagePreview.innerHTML = '<span>Nicio poză selectată</span>';
    return;
  }
  if (source instanceof Blob) {
    pendingPreviewUrl = URL.createObjectURL(source);
    source = pendingPreviewUrl;
  }
  equipmentImagePreview.innerHTML = `<img src="${escapeHtml(source)}" alt="Previzualizare item">`;
}

async function optimizeEquipmentImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Poza trebuie să fie PNG, JPG sau WEBP.');
  const bitmap = await createImageBitmap(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .9));
  if (!blob) throw new Error('Poza nu a putut fi procesată.');
  if (blob.size > 3 * 1024 * 1024) throw new Error('Poza este prea mare chiar și după optimizare.');
  return blob;
}

async function uploadEquipmentImage() {
  if (!pendingEquipmentImage) throw new Error('Alege mai întâi poza itemului.');
  const response = await fetch(`/api/progress/equipment/${activeSlot.field}/image`, {
    method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': pendingEquipmentImage.type }, body: pendingEquipmentImage
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Poza nu a putut fi încărcată.');
  return payload.image;
}

function openPicker(button) {
  activeSlot = { kind: button.dataset.kind, field: button.dataset.slot };
  const state = activeSlot.kind === 'alchemy' ? alchemyState[activeSlot.field] : equipmentState[activeSlot.field];
  const labels = activeSlot.kind === 'alchemy' ? alchemyLabels : equipmentLabels;
  pickerTitle.textContent = labels[activeSlot.field];
  equipmentImageEditor.hidden = true;
  alchemyEditor.hidden = true;
  applySlotButton.disabled = false;
  pendingEquipmentImage = null;
  equipmentImageInput.value = '';

  if (activeSlot.kind === 'equipment') {
    pickerEyebrow.textContent = 'POZĂ ECHIPAMENT';
    pickerTitle.textContent = labels[activeSlot.field];
    equipmentImageEditor.hidden = false;
    equipmentUploadStatus.textContent = state.image ? 'Poți înlocui poza existentă selectând una nouă.' : 'Poza va fi redimensionată automat pentru a păstra textul itemului lizibil.';
    equipmentUploadStatus.className = 'equipment-upload-status';
    applySlotButton.textContent = state.image ? 'Înlocuiește poza' : 'Încarcă poza';
    clearSlotButton.textContent = 'Șterge poza';
    applySlotButton.disabled = true;
    showEquipmentPreview(safeItemImage(state.image));
  } else {
    pickerEyebrow.textContent = 'EDITOR ALCHIMIE';
    applySlotButton.textContent = 'Aplică';
    clearSlotButton.textContent = 'Golește slotul';
    alchemyEditor.hidden = false;
    configureAlchemyEditor(state);
  }
  picker.showModal();
}

document.querySelectorAll('.inventory-slot, .alchemy-slot').forEach(button => {
  button.addEventListener('click', () => openPicker(button));
});

equipmentImageInput?.addEventListener('change', async () => {
  const file = equipmentImageInput.files?.[0];
  if (!file) return;
  applySlotButton.disabled = true;
  equipmentUploadStatus.textContent = 'Se pregătește poza…';
  equipmentUploadStatus.className = 'equipment-upload-status';
  try {
    pendingEquipmentImage = await optimizeEquipmentImage(file);
    showEquipmentPreview(pendingEquipmentImage);
    equipmentUploadStatus.textContent = `Poză pregătită · ${(pendingEquipmentImage.size / 1024).toFixed(0)} KB`;
    equipmentUploadStatus.className = 'equipment-upload-status success';
    applySlotButton.disabled = false;
  } catch (error) {
    pendingEquipmentImage = null;
    showEquipmentPreview('');
    equipmentUploadStatus.textContent = error.message;
    equipmentUploadStatus.className = 'equipment-upload-status error';
  }
});

applySlotButton?.addEventListener('click', async () => {
  if (!activeSlot) return;
  if (activeSlot.kind === 'alchemy') {
    alchemyState[activeSlot.field] = alchemySlotFromSelection();
    renderSlot('alchemy', activeSlot.field);
    picker.close();
    return;
  }
  picker.classList.add('is-uploading');
  equipmentUploadStatus.textContent = 'Se încarcă poza în profil…';
  try {
    const image = await uploadEquipmentImage();
    equipmentState[activeSlot.field] = { ...emptySlot(), itemId: 'uploaded-image', name: 'Poză încărcată', image };
    renderSlot('equipment', activeSlot.field);
    picker.close();
  } catch (error) {
    equipmentUploadStatus.textContent = error.message;
    equipmentUploadStatus.className = 'equipment-upload-status error';
  } finally {
    picker.classList.remove('is-uploading');
  }
});

alchemyClarity?.addEventListener('change', () => updateAlchemyLevels(0, selectedAlchemyBonusIds()));
alchemyLevel?.addEventListener('change', () => renderAlchemyValues(selectedAlchemyBonusIds()));

document.querySelector('#clear-slot')?.addEventListener('click', async () => {
  if (!activeSlot) return;
  const collection = activeSlot.kind === 'alchemy' ? alchemyState : equipmentState;
  if (activeSlot.kind === 'equipment') {
    const response = await fetch(`/api/progress/equipment/${activeSlot.field}/image`, { method: 'DELETE', credentials: 'same-origin' });
    if (!response.ok) {
      equipmentUploadStatus.textContent = 'Poza nu a putut fi ștearsă.';
      equipmentUploadStatus.className = 'equipment-upload-status error';
      return;
    }
  }
  collection[activeSlot.field] = emptySlot();
  renderSlot(activeSlot.kind, activeSlot.field);
  picker.close();
});

picker?.addEventListener('click', event => {
  if (event.target === picker) picker.close();
});

function renderIdentity(user, progress) {
  const avatar = user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="">` : '<span class="avatar-fallback">D</span>';
  const profile = progress?.profile;
  identity.innerHTML = `${avatar}<div><small>CONT DISCORD</small><strong>${escapeHtml(user.username)}</strong><span>${profile ? `${escapeHtml(profile.characterName)} · Tier ${profile.tier}` : 'Profil necompletat'}</span></div>`;
}

function slotEntries(collection = {}, labels = {}) {
  return Object.entries(collection)
    .map(([key, value]) => [key, normalizeSlot(value)])
    .filter(([, value]) => value.name)
    .map(([key, value]) => ({ label: labels[key] || key, ...value }));
}

function renderDefinitionList(entries) {
  if (!entries.length) return '<p>Nicio informație completată.</p>';
  return `<dl>${entries.map(entry => {
    const image = safeItemImage(entry.image);
    return `<div><dt>${escapeHtml(entry.label)}</dt><dd><strong>${escapeHtml(entry.name)}</strong>${entry.bonuses ? `<span>${escapeHtml(entry.bonuses)}</span>` : ''}${image ? `<a class="admin-equipment-image" href="${image}" target="_blank" rel="noreferrer"><img src="${image}" alt="${escapeHtml(entry.label)}" loading="lazy"></a>` : ''}</dd></div>`;
  }).join('')}</dl>`;
}

function renderPlayers(players) {
  adminSummary.innerHTML = `<article><strong>${players.length}</strong><span>profiluri salvate</span></article><article><strong>${players.filter(player => player.profile?.tier === 3).length}</strong><span>jucători Tier III</span></article><article><strong>${players.filter(player => player.profile?.championLevel > 0).length}</strong><span>nivel Campion</span></article>`;
  if (!players.length) {
    playersList.innerHTML = '<p class="empty-state">Niciun membru nu și-a salvat încă progresul.</p>';
    return;
  }

  playersList.innerHTML = players.map(player => {
    const profile = player.profile || {};
    const equipment = slotEntries(profile.equipment, equipmentLabels).filter(entry => safeItemImage(entry.image));
    const alchemy = slotEntries(profile.alchemy, alchemyLabels);
    const progression = Object.entries(profile.progress || {}).filter(([, value]) => value).map(([key, value]) => ({ label: progressLabels[key] || key, name: value, bonuses: '' }));
    const avatar = player.discord_avatar ? `<img src="${escapeHtml(player.discord_avatar)}" alt="">` : '<span class="avatar-fallback">D</span>';
    return `<details class="player-card">
      <summary>${avatar}<div><strong>${escapeHtml(profile.characterName || 'Personaj fără nume')}</strong><span>${escapeHtml(player.discord_username)} · ${escapeHtml(raceLabels[profile.race] || profile.race || 'Rasă nesetată')}</span></div><div class="player-level"><b>Tier ${Number(profile.tier) || 1}</b><span>Lv. ${Number(profile.level) || 1}${profile.championLevel ? ` · C${Number(profile.championLevel)}` : ''}</span></div><i>＋</i></summary>
      <div class="player-details">
        <section><h3>Echipament</h3>${renderDefinitionList(equipment)}</section>
        <section><h3>Alchimie</h3>${renderDefinitionList(alchemy)}</section>
        <section><h3>Progres</h3>${renderDefinitionList(progression)}${profile.notes ? `<div class="admin-notes"><strong>Observații</strong><p>${escapeHtml(profile.notes)}</p></div>` : ''}</section>
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

function configureManagerPanel(me) {
  const isAdmin = Boolean(me.canAdminProgress);
  const tiers = me.managedProgressTiers || [];
  document.querySelector('#manager-eyebrow').textContent = isAdmin ? 'PANOU ADMIN' : 'PANOU RESPONSABIL';
  document.querySelector('#manager-title').textContent = isAdmin ? 'Progresul tuturor membrilor' : `Progres Tier ${tiers.join(', ')}`;
  document.querySelector('#manager-description').textContent = isAdmin
    ? 'Ai acces la echipamentul și progresul tuturor tierurilor.'
    : `Ai acces numai la membrii din Tier ${tiers.join(', ')}.`;
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
    if (me.managedProgressTiers?.length) await loadAdminPlayers();
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
    renderAllSlots();
    form.hidden = false;

    if (me.managedProgressTiers?.length) {
      configureManagerPanel(me);
      adminPanel.hidden = false;
      await loadAdminPlayers();
    }
  } catch (error) {
    identity.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

initializeProgressPage();
