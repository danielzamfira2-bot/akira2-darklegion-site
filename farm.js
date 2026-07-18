const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.farm-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation?.classList.toggle('open', !isOpen);
});

function renderStrategy(section, strategy) {
  section.classList.remove('locked');
  section.classList.add('unlocked');
  section.querySelector('h2').textContent = strategy.title;
  section.querySelector('.access-badge').textContent = 'DEBLOCAT';
  section.querySelector('.access-badge').classList.add('open');
  section.querySelector('.locked-panel').outerHTML = `
    <p class="tier-subtitle">${strategy.subtitle}</p>
    <div class="strategy-columns protected-columns">
      ${strategy.sections.map(group => `
        <article><small>PLAN FARM</small><h3>${group.title}</h3><ul>${group.items.map(item => `<li>${item}</li>`).join('')}</ul></article>
      `).join('')}
    </div>`;
}

async function loadFarmAccess() {
  try {
    const meResponse = await fetch('/api/me', { credentials: 'same-origin' });
    const me = await meResponse.json();
    if (!me.authenticated) return;

    for (const tier of [2, 3]) {
      if (me.tier < tier) continue;
      const response = await fetch(`/api/farm/tier/${tier}`, { credentials: 'same-origin' });
      if (!response.ok) continue;
      const payload = await response.json();
      renderStrategy(document.querySelector(`[data-tier="${tier}"]`), payload.strategy);
    }
  } catch {
    // Conținutul public rămâne disponibil dacă verificarea nu poate fi făcută.
  }
}

loadFarmAccess();
