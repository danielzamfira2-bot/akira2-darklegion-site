const raceName = document.querySelector('.guide-sidebar h1')?.textContent.trim() || 'Personaj';
const publicLevel = document.querySelector('#level-1');
const guideHeaderNav = document.querySelector('.guide-header > nav');

if (guideHeaderNav && !guideHeaderNav.querySelector('a[href="../farm.html"]')) {
  const farmLink = document.createElement('a');
  farmLink.href = '../farm.html';
  farmLink.textContent = 'Strategie Farm';
  guideHeaderNav.insertBefore(farmLink, guideHeaderNav.lastElementChild);
}

if (guideHeaderNav && !guideHeaderNav.querySelector('a[href="../progres.html"]')) {
  const progressLink = document.createElement('a');
  progressLink.href = '../progres.html';
  progressLink.textContent = 'Progres';
  guideHeaderNav.insertBefore(progressLink, guideHeaderNav.lastElementChild);
}

if (publicLevel) {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '../tier-guide.css';
  document.head.appendChild(style);

  publicLevel.innerHTML = `
    <div class="level-head">
      <div><span class="chapter">TIER I · ${raceName.toUpperCase()}</span><h3>Pregătirea pentru Harta Fermecată</h3><p>Conținut public · cerințe minime și bonusuri recomandate</p></div>
      <span class="level-badge">DEBLOCAT</span>
    </div>

    <div class="tier-intro">
      <strong>Obiectiv</strong>
      <p>Pregătește personajul pentru Harta Fermecată — Map 1 Yohara. Lista reprezintă o bază minimă de progres, nu un build perfect.</p>
    </div>

    <details class="tier-block" open>
      <summary><span>01</span><div><small>CHECKLIST</small>Echipament și progres minim</div><b>＋</b></summary>
      <div class="requirements-grid">
        <article><small>ZONĂ</small><strong>Harta Fermecată</strong><span>Map 1 Yohara</span></article>
        <article><small>ALCHIMIE</small><strong>Set opac</strong><span>Build PvM de bază</span></article>
        <article><small>ARMĂ</small><strong>Sabie/Lamă Zodiac</strong><span>+8 sau +9</span></article>
        <article><small>ARMURĂ</small><strong>Armură cu Mob</strong><span>Minimum +6</span></article>
        <article><small>COIF ȘI CUREA</small><strong>Minimum +8</strong><span>Potrivite nivelului</span></article>
        <article><small>SCUT</small><strong>Scut Titan +9</strong><span>Cu bonusurile recomandate</span></article>
        <article><small>PET · NIVEL 81</small><strong>Alastor / Executor / Razador</strong><span>Antrenament, Berserker, Vânător</span></article>
        <article><small>MĂNUȘĂ YOHARA</small><strong>Minimum +4</strong><span>Pietre Dure Simple +4</span></article>
        <article><small>BIJUTERII</small><strong>Brățară și Cercei Beril +6</strong><span>Cu finisaje</span></article>
        <article><small>TALISMAN</small><strong>Misterios de Gheață</strong><span>Varianta recomandată</span></article>
        <article><small>COLIER</small><strong>Lacrima Cerului +9</strong><span>Cu bonusuri PvM</span></article>
        <article><small>PAPUCI</small><strong>Apă sau Foc +8</strong><span>În funcție de set</span></article>
        <article><small>EȘARFĂ</small><strong>25% · Arc Zodiac +8</strong><span>12% medie și 1–2 Pătrundere minimum</span></article>
        <article><small>CAL</small><strong>Nivel 21 minimum</strong><span>Continuă evoluția</span></article>
        <article><small>BIOLOG</small><strong>Nivel 80 minimum</strong><span>Misiunile făcute la timp</span></article>
        <article><small>BOOST</small><strong>Set costum și damage</strong><span>Pregătit pentru farm</span></article>
      </div>
    </details>

    <details class="tier-block" open>
      <summary><span>02</span><div><small>ALCHIMIE OPACĂ</small>Bonusurile recomandate</div><b>＋</b></summary>
      <div class="alchemy-grid">
        <article><i class="diamond">◆</i><div><strong>Diamant</strong><span>Rezistență PC</span></div></article>
        <article><i class="ruby">◆</i><div><strong>Rubin</strong><span>Valoare medie și Rezistență medie</span></div></article>
        <article><i class="jade">◆</i><div><strong>Jad</strong><span>Max PV, Absorbție PV, Refacere PV</span></div></article>
        <article><i class="sapphire">◆</i><div><strong>Safir</strong><span>3 apărări</span></div></article>
        <article><i class="garnet">◆</i><div><strong>Granat</strong><span>Orice variantă la început</span></div></article>
        <article><i class="onyx">◆</i><div><strong>Onyx</strong><span>Rez. Critică, Evitare Săgeți, Blocare corporală</span></div></article>
        <article><i class="amethyst">◆</i><div><strong>Ametist</strong><span>Metine și 3× Status</span></div></article>
      </div>
    </details>

    <details class="tier-block" open>
      <summary><span>03</span><div><small>ITEME</small>Lista bonusurilor recomandate</div><b>＋</b></summary>
      <div class="bonus-table-wrap"><table class="bonus-table"><thead><tr><th>Item</th><th>Bonusuri principale</th><th>6/7 și observații</th></tr></thead><tbody>
        <tr><td>Armă</td><td>45%+ medie, 10 Pătrundere</td><td>Recomandat 5% Mob/Metine</td></tr>
        <tr><td>Coif</td><td>Evitare Săgeți, Magie, Foc</td><td>30+ Atac</td></tr>
        <tr><td>Armură</td><td>50 Atac, 5% Abs. PV, 15 Magie, 1.500 PV</td><td>30+ Atac</td></tr>
        <tr><td>Papuci</td><td>15 Evitare Săgeți, 10 Critică, 1.500 PV</td><td>Apă sau Foc</td></tr>
        <tr><td>Scut</td><td>15 Blocare, 12 Putere, Imun</td><td>Imun dacă nu ai costum Aură</td></tr>
        <tr><td>Brățară</td><td>10 Pătrundere, 5% Abs. PV, 1.500 PV</td><td>Magie, dacă este disponibilă</td></tr>
        <tr><td>Cercei</td><td>20 Diavol, 20 Drop</td><td>Cu finisaje</td></tr>
        <tr><td>Colier</td><td>2.000 PV, 10 Critică</td><td>Lacrima Cerului +9</td></tr>
        <tr><td>Mănușă Yohara</td><td>12 Precizie, Absorbție PV</td><td>Pietre Dure Simple +4</td></tr>
        <tr><td>Skin frizură</td><td>15 Magie, Evitare Săgeți</td><td>—</td></tr>
        <tr><td>Skin armură</td><td>50 Atac, 15 Magie</td><td>—</td></tr>
        <tr><td>Skin armă</td><td>10 Pătrundere</td><td>—</td></tr>
        <tr><td>Talisman</td><td>Minimum 3 apărări</td><td>25% Gheață și Întuneric</td></tr>
      </tbody></table></div>
    </details>

    <details class="tier-block supplies" open>
      <summary><span>04</span><div><small>CONSUMABILE</small>Pregătirea înainte de farm</div><b>＋</b></summary>
      <div class="supply-list"><span>Apă de Atac</span><span>Dulciuri</span><span>Rouă</span><span>Zahăr pentru Armăsar</span><span>Atacurile Zeului Dragon</span><span>Cristal de Energie 10</span><span>Diamond Box</span></div>
    </details>`;
}

const lockedPreviews = {
  2: ['Map 2 · Șarpe', 'Echipament și Element +3', 'Alchimie minim Strălucitoare', 'Conturi de plus'],
  3: ['Șarpe · Alastor', 'Alchimie endgame', 'Echipament Șarpe', 'Pregătire completă']
};

Object.entries(lockedPreviews).forEach(([level, modules]) => {
  const section = document.querySelector(`#level-${level}`);
  const grid = section?.querySelector('.lesson-grid');
  if (grid) grid.innerHTML = modules.map((module, index) => `<div class="lesson-card"><span>0${index + 1}</span><h4>${module}</h4><p>Detaliile sunt disponibile numai după aprobarea accesului.</p></div>`).join('');
});

document.querySelectorAll('a[href^="#level-"]').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.level-link').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));

const protectedStyle = document.createElement('link');
protectedStyle.rel = 'stylesheet';
protectedStyle.href = '../protected-guide.css';
document.head.appendChild(protectedStyle);

const authScript = document.createElement('script');
authScript.src = '/auth-ui.js';
document.body.appendChild(authScript);

function renderProtectedGuide(section, payload) {
  section.classList.remove('locked');
  section.classList.add('unlocked');
  const head = section.querySelector('.level-head');
  head.querySelector('h3').textContent = payload.title;
  head.querySelector('p').textContent = payload.subtitle;
  head.querySelector('.level-badge').textContent = 'DEBLOCAT';

  const grid = section.querySelector('.lesson-grid');
  grid.classList.add('protected-guide-grid');
  grid.innerHTML = payload.sections.map((module, index) => `
    <div class="lesson-card protected-module">
      <span>0${index + 1}</span><h4>${module.title}</h4>
      <ul>${module.items.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>`).join('');
  section.querySelector('.locked-action')?.remove();
}

async function loadDiscordAccess() {
  try {
    const response = await fetch('/api/me', { credentials: 'same-origin' });
    const me = await response.json();
    const accessLabel = document.querySelector('.access-public');
    if (me.authenticated && accessLabel) {
      accessLabel.textContent = `Acces Tier ${me.tier}`;
      accessLabel.classList.add('access-tier-label');
    }

    document.querySelectorAll('.request-button').forEach(button => {
      if (!me.authenticated) {
        button.href = `/auth/discord?return=${encodeURIComponent(location.pathname + button.closest('.level-section').id.replace(/^/, '#'))}`;
        button.textContent = 'Login cu Discord →';
      }
    });

    if (!me.authenticated) return;
    const race = location.pathname.split('/').pop().replace('.html', '').toLowerCase();
    for (const tier of [2, 3]) {
      if (me.tier < tier) continue;
      const guideResponse = await fetch(`/api/guides/${race}/tier/${tier}`, { credentials: 'same-origin' });
      if (!guideResponse.ok) continue;
      const data = await guideResponse.json();
      renderProtectedGuide(document.querySelector(`#level-${tier}`), data.guide);
    }
  } catch {
    // Site-ul deschis direct ca fișier păstrează doar conținutul public.
  }
}

loadDiscordAccess();
