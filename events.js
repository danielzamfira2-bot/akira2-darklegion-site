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
let zone = 'romania';
const body = document.querySelector('#calendar-body');

function shiftTime(time, amount) {
  const [hours, minutes] = time.split(':').map(Number);
  return `${String((hours + amount + 24) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function rangeLabel(range) {
  const shift = zone === 'romania' ? 1 : 0;
  return `${shiftTime(range[0], shift)}–${shiftTime(range[1], shift)}`;
}

function specialLabel(value) {
  const [start, end] = value.split('–');
  const shift = zone === 'romania' ? 1 : 0;
  return `${shiftTime(start, shift)}–${end === '23:59' ? (shift ? '00:59' : end) : shiftTime(end, shift)}`;
}

function currentIndex() {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Bucharest', weekday: 'short' }).format(new Date());
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday];
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
  const entries = today.events.map((name, index) => ({ name, time: rangeLabel(baseSlots[index]), hour: Number(baseSlots[index][0].split(':')[0]) + 1 }));
  entries.push({ name: today.special, time: specialLabel(today.specialTime), hour: Number(today.specialTime.slice(0, 2)) + 1 });
  document.querySelector('#today-events').innerHTML = entries.map(event => `<div class="event-pill"><span>${event.time}</span><strong>${event.name}</strong></div>`).join('');

  const nowHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', hour: '2-digit', hour12: false }).format(new Date()));
  const next = entries.filter(event => event.hour > nowHour).sort((a, b) => a.hour - b.hour)[0];
  document.querySelector('#next-event').innerHTML = next
    ? `<p class="label">URMĂTORUL EVENIMENT</p><strong>${next.name}</strong><span>Astăzi la ${next.time.split('–')[0]} · ${zone === 'romania' ? 'ora României' : 'ora serverului'}</span>`
    : `<p class="label">PROGRAMUL DE AZI</p><strong>Evenimente încheiate</strong><span>Revino mâine pentru următoarea rotație.</span>`;
}

function updateClock() {
  const now = new Date();
  document.querySelector('#ro-clock').textContent = new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', weekday: 'long', day: 'numeric', month: 'long' }).format(now).toUpperCase();
}

document.querySelectorAll('[data-zone]').forEach(button => button.addEventListener('click', () => {
  zone = button.dataset.zone;
  document.querySelectorAll('[data-zone]').forEach(item => item.classList.toggle('active', item === button));
  render();
}));

updateClock();
setInterval(updateClock, 1000);
render();
