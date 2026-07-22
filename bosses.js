const bosses = [
  { id: 'kao', name: 'Kao', mapName: 'Fortăreața Abandonată', zone: 'Map 1 Yohara', group: 'map1', locations: [{ label: 'Spawn principal', map: 'assets/bosses/kao-map.png', spawn: 'assets/bosses/kao-spawn.png', ratio: '260/282', marker: [79, 27] }] },
  { id: 'king-bao', name: 'King Bao', mapName: 'Fortăreața Abandonată', zone: 'Map 1 Yohara', group: 'map1', warning: 'Atenție! Doar bossul King Bao dropează iteme. King Bao (Quest) nu dropează nimic.', locations: [{ label: 'Spawn principal', map: 'assets/bosses/bao-map.png', spawn: 'assets/bosses/bao-spawn.png', ratio: '260/282', marker: [50, 23] }] },
  { id: 'argos', name: 'Argos', mapName: 'Aria Dong Gwang', zone: 'Map 2 Yohara', group: 'map2', locations: [
    { label: 'Spawn 1 din 3', map: 'assets/bosses/argos-map1.png', spawn: 'assets/bosses/argos-spawn1.png', ratio: '209/287', marker: [4.5, 47.5] },
    { label: 'Spawn 2 din 3', map: 'assets/bosses/argos-map2.png', spawn: 'assets/bosses/argos-spawn2.png', ratio: '209/287', marker: [48, 46.5] },
    { label: 'Spawn 3 din 3', map: 'assets/bosses/argos-map3.png', spawn: 'assets/bosses/argos-spawn3.png', ratio: '209/287', marker: [61.5, 87] }
  ] }
];

const bossList = document.querySelector('#boss-list');
const lightbox = document.querySelector('#boss-lightbox');
const selectedLocations = Object.fromEntries(bosses.map(boss => [boss.id, 0]));
let activeFilter = 'all';

function renderBosses() {
  const visible = bosses.filter(boss => activeFilter === 'all' || boss.group === activeFilter);
  bossList.innerHTML = visible.map(boss => {
    const index = selectedLocations[boss.id];
    const location = boss.locations[index];
    const tabs = boss.locations.length > 1 ? `<div class="spawn-tabs">${boss.locations.map((item, itemIndex) => `<button class="${itemIndex === index ? 'active' : ''}" data-boss="${boss.id}" data-location="${itemIndex}">${item.label}</button>`).join('')}</div>` : '';
    return `<article class="boss-card" data-group="${boss.group}">
      <header><div><span class="boss-index">${String(bosses.indexOf(boss) + 1).padStart(2, '0')}</span><p class="eyebrow">${boss.zone}</p><h2>${boss.name}</h2><small>${boss.mapName}</small></div><span class="location-count">${boss.locations.length} ${boss.locations.length === 1 ? 'LOCAȚIE' : 'LOCAȚII'}</span></header>
      ${boss.warning ? `<aside class="boss-warning"><b>!</b><p>${boss.warning}</p></aside>` : ''}${tabs}
      <div class="boss-media">
        <button class="map-shot" data-image="${location.map}" data-title="${boss.name} · ${location.label}" data-kind="HARTĂ"><span class="map-canvas" style="--map-ratio:${location.ratio}"><img src="${location.map}" alt="Hartă ${boss.name}"><i class="spawn-marker" style="--marker-x:${location.marker[0]}%;--marker-y:${location.marker[1]}%"><span></span></i></span><em>Deschide harta</em></button>
        <button class="world-shot" data-image="${location.spawn}" data-title="${boss.name} · ${location.label}" data-kind="ZONĂ SPAWN"><img src="${location.spawn}" alt="Zona de spawn ${boss.name}"><em>Vezi zona mărită</em></button>
      </div><footer><strong>${location.label}</strong><span>Punctul roșu marchează poziția pe hartă.</span></footer>
    </article>`;
  }).join('');
}

document.querySelector('.menu-button')?.addEventListener('click', event => {
  const open = document.querySelector('.progress-nav').classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('[data-map-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.mapFilter;
  document.querySelectorAll('[data-map-filter]').forEach(item => item.classList.toggle('active', item === button));
  renderBosses();
}));
bossList.addEventListener('click', event => {
  const tab = event.target.closest('[data-location]');
  if (tab) { selectedLocations[tab.dataset.boss] = Number(tab.dataset.location); renderBosses(); return; }
  const imageButton = event.target.closest('[data-image]');
  if (!imageButton) return;
  document.querySelector('#lightbox-kind').textContent = imageButton.dataset.kind;
  document.querySelector('#lightbox-title').textContent = imageButton.dataset.title;
  const image = document.querySelector('#lightbox-image');
  image.src = imageButton.dataset.image; image.alt = imageButton.dataset.title;
  lightbox.showModal();
});
lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('close', () => document.querySelector('#lightbox-image').removeAttribute('src'));
renderBosses();
