const weeklyPanel = document.querySelector('#weekly-panel');
const weeklyDate = document.querySelector('#weekly-date');
const weeklyForm = document.querySelector('#weekly-task-form');
const weeklyTaskId = document.querySelector('#weekly-task-id');
const weeklyTier = document.querySelector('#weekly-tier');
const weeklyPlayer = document.querySelector('#weekly-player');
const weeklyItem = document.querySelector('#weekly-item');
const weeklyQuantity = document.querySelector('#weekly-quantity');
const weeklyList = document.querySelector('#weekly-task-list');
const weeklyStatus = document.querySelector('#weekly-status');
const weeklyCancelEdit = document.querySelector('#weekly-cancel-edit');

let weeklyPlayers = [];
let weeklyTasks = [];
let weeklyManagedTiers = [];

function weeklyEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function mondayFor(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const dateNumber = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateNumber}`;
}

function setWeeklyStatus(message = '', type = '') {
  weeklyStatus.textContent = message;
  weeklyStatus.className = `weekly-status ${type}`.trim();
}

function playerLabel(player) {
  const character = player.profile?.characterName;
  return character ? `${character} (${player.discord_username})` : player.discord_username;
}

function populateWeeklyPlayers() {
  const tier = Number(weeklyTier.value);
  const available = weeklyPlayers.filter(player => Number(player.profile?.tier || 1) === tier);
  const selected = weeklyPlayer.value;
  weeklyPlayer.innerHTML = '<option value="">Selectează persoana</option>' + available
    .map(player => `<option value="${weeklyEscape(player.discord_user_id)}">${weeklyEscape(playerLabel(player))}</option>`).join('');
  if (available.some(player => player.discord_user_id === selected)) weeklyPlayer.value = selected;
}

function renderWeeklyTasks() {
  if (!weeklyTasks.length) {
    weeklyList.innerHTML = '<tr><td colspan="6" class="weekly-empty">Nu există taskuri pentru această săptămână.</td></tr>';
    return;
  }
  weeklyList.innerHTML = weeklyTasks.map(task => `
    <tr class="${task.completed ? 'is-completed' : ''}">
      <td><b class="tier-badge">Tier ${task.tier}</b></td>
      <td><strong>${weeklyEscape(task.discord_username)}</strong></td>
      <td>${weeklyEscape(task.item_or_woni)}</td>
      <td>${Number(task.quantity).toLocaleString('ro-RO')}</td>
      <td><label class="task-check"><input type="checkbox" data-complete="${task.id}" ${task.completed ? 'checked' : ''}><span>${task.completed ? 'Finalizat' : 'În lucru'}</span></label></td>
      <td><div class="task-actions"><button type="button" data-edit="${task.id}">Editează</button><button type="button" data-delete="${task.id}">Șterge</button></div></td>
    </tr>`).join('');
}

function resetWeeklyForm() {
  weeklyTaskId.value = '';
  weeklyItem.value = '';
  weeklyQuantity.value = '1';
  weeklyTier.disabled = false;
  weeklyPlayer.disabled = false;
  weeklyCancelEdit.hidden = true;
  weeklyForm.querySelector('button[type="submit"]').textContent = 'Adaugă task';
}

async function loadWeeklyTasks() {
  setWeeklyStatus('Se încarcă evidența…');
  const response = await fetch(`/api/weekly-tasks?week=${encodeURIComponent(weeklyDate.value)}`, { credentials: 'same-origin' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Evidența nu a putut fi încărcată.');
  weeklyPlayers = payload.players || [];
  weeklyTasks = payload.tasks || [];
  weeklyManagedTiers = payload.managedTiers || [];
  const selectedTier = Number(weeklyTier.value);
  weeklyTier.innerHTML = weeklyManagedTiers.map(tier => `<option value="${tier}">Tier ${tier}</option>`).join('');
  if (weeklyManagedTiers.includes(selectedTier)) weeklyTier.value = String(selectedTier);
  populateWeeklyPlayers();
  renderWeeklyTasks();
  setWeeklyStatus('');
}

weeklyForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const id = weeklyTaskId.value;
  const body = id
    ? { itemOrWoni: weeklyItem.value, quantity: Number(weeklyQuantity.value) }
    : { weekStart: weeklyDate.value, tier: Number(weeklyTier.value), discordUserId: weeklyPlayer.value, itemOrWoni: weeklyItem.value, quantity: Number(weeklyQuantity.value) };
  const button = weeklyForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setWeeklyStatus(id ? 'Se salvează modificarea…' : 'Se adaugă taskul…');
  try {
    const response = await fetch(id ? `/api/weekly-tasks/${id}` : '/api/weekly-tasks', {
      method: id ? 'PUT' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Taskul nu a putut fi salvat.');
    resetWeeklyForm();
    await loadWeeklyTasks();
    setWeeklyStatus('Task salvat.', 'success');
  } catch (error) {
    setWeeklyStatus(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

weeklyTier?.addEventListener('change', populateWeeklyPlayers);
weeklyDate?.addEventListener('change', () => {
  resetWeeklyForm();
  loadWeeklyTasks().catch(error => setWeeklyStatus(error.message, 'error'));
});
weeklyCancelEdit?.addEventListener('click', resetWeeklyForm);

weeklyList?.addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) {
    const task = weeklyTasks.find(item => String(item.id) === editButton.dataset.edit);
    if (!task) return;
    weeklyTaskId.value = task.id;
    weeklyTier.value = task.tier;
    populateWeeklyPlayers();
    weeklyPlayer.value = task.discord_user_id;
    weeklyItem.value = task.item_or_woni;
    weeklyQuantity.value = task.quantity;
    weeklyTier.disabled = true;
    weeklyPlayer.disabled = true;
    weeklyCancelEdit.hidden = false;
    weeklyForm.querySelector('button[type="submit"]').textContent = 'Salvează modificarea';
    weeklyItem.focus();
  }
  if (deleteButton && confirm('Ștergi acest task din evidența săptămânală?')) {
    try {
      const response = await fetch(`/api/weekly-tasks/${deleteButton.dataset.delete}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) throw new Error((await response.json()).error || 'Taskul nu a putut fi șters.');
      await loadWeeklyTasks();
      setWeeklyStatus('Task șters.', 'success');
    } catch (error) {
      setWeeklyStatus(error.message, 'error');
    }
  }
});

weeklyList?.addEventListener('change', async event => {
  const checkbox = event.target.closest('[data-complete]');
  if (!checkbox) return;
  try {
    const response = await fetch(`/api/weekly-tasks/${checkbox.dataset.complete}`, {
      method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: checkbox.checked })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Starea nu a putut fi salvată.');
    await loadWeeklyTasks();
  } catch (error) {
    checkbox.checked = !checkbox.checked;
    setWeeklyStatus(error.message, 'error');
  }
});

async function initializeWeeklyTasks() {
  const me = await fetch('/api/me', { credentials: 'same-origin' }).then(response => response.json());
  if (!me.authenticated || !me.managedProgressTiers?.length) return;
  weeklyDate.value = mondayFor();
  weeklyPanel.hidden = false;
  await loadWeeklyTasks();
}

initializeWeeklyTasks().catch(error => setWeeklyStatus(error.message, 'error'));
