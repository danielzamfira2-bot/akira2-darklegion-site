const schedule = [
  { day: 'LUNI', short: 'Lun', events: ['Concentrated Reading', 'Cor Daemonis', 'Tiger Coin'], special: 'Jigsaw Event', specialTime: '19:00–23:59' },
  { day: 'MARȚI', short: 'Mar', events: ['Researcher Elixir', 'Exorcism Scroll', 'Fine Cloth'], special: 'Mining Event', specialTime: '19:00–23:59' },
  { day: 'MIERCURI', short: 'Mie', events: ["Blacksmith’s Stone", 'Time Spiral (50%)', 'Passage Ticket'], special: 'Metin Fever', specialTime: '00:00–23:59' },
  { day: 'JOI', short: 'Joi', events: ['Sun Elixir', 'Fodder', 'Inventory Expansion'], special: 'Hexagonal Event', specialTime: '19:00–23:59' },
  { day: 'VINERI', short: 'Vin', events: ['Small Orison', 'Robin (loot)', 'Pet Book Chest'], special: 'Moonlight Event', specialTime: '19:00–23:59' },
  { day: 'SÂMBĂTĂ', short: 'Sâm', events: ['Tasty Treats', 'Flame of the Dragon', 'Shard Chest'], special: 'Football Event', specialTime: '19:00–23:59' },
  { day: 'DUMINICĂ', short: 'Dum', events: ['Tiger Coin', 'Cor Daemonis (noble)', 'Cor Daemonis (cut)'], special: 'Medal Event', specialTime: '00:00–23:59' }
];

const baseSlots = [['14:00', '17:00'], ['19:00', '22:00'], ['00:00', '03:00']];
const serverTimeZone = 'Europe/Berlin';
const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
let zone = 'local';
const body = document.querySelector('#calendar-body');

function timeZoneOffsetMinutes(timeZone, date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime()) / 60000);
}

function localShiftMinutes() {
  if (zone === 'server') return 0;
  const now = new Date();
  return timeZoneOffsetMinutes(localTimeZone, now) - timeZoneOffsetMinutes(serverTimeZone, now);
}

function shiftTime(time, amountMinutes = localShiftMinutes()) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = (hours * 60 + minutes + amountMinutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function rangeLabel(range) {
  return `${shiftTime(range[0])}–${shiftTime(range[1])}`;
}

function specialLabel(value) {
  const [start, end] = value.split('–');
  return `${shiftTime(start)}–${shiftTime(end)}`;
}

function currentIndex() {
  const displayTimeZone = zone === 'server' ? serverTimeZone : localTimeZone;
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: displayTimeZone, weekday: 'short' }).format(new Date());
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday];
}

function startMinutes(time) {
  const shifted = shiftTime(time);
  const [hours, minutes] = shifted.split(':').map(Number);
  return hours * 60 + minutes;
}

function render() {
  document.querySelectorAll('.slot-time').forEach((element, index) => element.textContent = rangeLabel(baseSlots[index]));
  body.innerHTML = schedule.map((item, index) => `
    <tr class="${index === currentIndex() ? 'today' : ''}">
      <td class="day-cell"><strong>${item.day}</strong><span>${item.short}</span></td>
      ${item.events.map((event, eventIndex) => `<td class="event-cell"><strong>${event}</strong><small>${rangeLabel(baseSlots[eventIndex])}</small></td>`).join('')}
      <td class="special-cell"><strong>${item.special}</strong><small>${specialLabel(item.specialTime)}</small></td>
      <td class="check">✓</td><td class="check">✓</td>
    </tr>`).join('');
  renderToday();
}

function renderToday() {
  const today = schedule[currentIndex()];
  const entries = today.events.map((name, index) => ({ name, time: rangeLabel(baseSlots[index]), minutes: startMinutes(baseSlots[index][0]) }));
  entries.push({ name: today.special, time: specialLabel(today.specialTime), minutes: startMinutes(today.specialTime.split('–')[0]) });
  document.querySelector('#today-events').innerHTML = entries.map(event => `<div class="event-pill"><span>${event.time}</span><strong>${event.name}</strong></div>`).join('');

  const displayTimeZone = zone === 'server' ? serverTimeZone : localTimeZone;
  const nowParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: displayTimeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  const nowMinutes = nowParts.hour * 60 + nowParts.minute;
  const next = entries.filter(event => event.minutes > nowMinutes).sort((a, b) => a.minutes - b.minutes)[0];
  document.querySelector('#next-event').innerHTML = next
    ? `<p class="label">URMĂTORUL EVENIMENT</p><strong>${next.name}</strong><span>Astăzi la ${next.time.split('–')[0]} · ${zone === 'local' ? 'ora dispozitivului' : 'ora serverului'}</span>`
    : `<p class="label">PROGRAMUL DE AZI</p><strong>Evenimente încheiate</strong><span>Revino mâine pentru următoarea rotație.</span>`;
}

function updateClock() {
  const now = new Date();
  const displayTimeZone = zone === 'server' ? serverTimeZone : localTimeZone;
  document.querySelector('#ro-clock').textContent = new Intl.DateTimeFormat('ro-RO', { timeZone: displayTimeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('ro-RO', { timeZone: displayTimeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(now).toUpperCase();
  document.querySelector('#clock-zone-label').textContent = zone === 'server' ? 'ORA SERVERULUI' : 'ORA LOCALĂ';
}

function updateTimeZoneInfo() {
  const shift = localShiftMinutes();
  const sign = shift >= 0 ? '+' : '−';
  const absolute = Math.abs(shift);
  const difference = absolute ? `${sign}${Math.floor(absolute / 60)}:${String(absolute % 60).padStart(2, '0')}` : 'aceeași oră';
  document.querySelector('#local-zone-short').textContent = localTimeZone.replace(/_/g, ' ');
  document.querySelector('#timezone-note-text').textContent = zone === 'server'
    ? 'Calendarul este afișat în ora serverului (CET/CEST).'
    : `Fus detectat: ${localTimeZone.replace(/_/g, ' ')} · diferență față de server: ${difference}.`;
}

document.querySelectorAll('[data-zone]').forEach(button => button.addEventListener('click', () => {
  zone = button.dataset.zone;
  document.querySelectorAll('[data-zone]').forEach(item => item.classList.toggle('active', item === button));
  updateTimeZoneInfo();
  updateClock();
  render();
}));

updateTimeZoneInfo();
updateClock();
setInterval(updateClock, 1000);
render();
