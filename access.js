const statusBox = document.querySelector('#discord-access');
const errorBox = document.querySelector('#access-error');
const params = new URLSearchParams(location.search);
const accessHeaderNav = document.querySelector('.guide-header > nav');

if (accessHeaderNav && !accessHeaderNav.querySelector('a[href="farm.html"]')) {
  const farmLink = document.createElement('a');
  farmLink.href = 'farm.html';
  farmLink.textContent = 'Strategie Farm';
  accessHeaderNav.insertBefore(farmLink, accessHeaderNav.lastElementChild);
}

if (accessHeaderNav && !accessHeaderNav.querySelector('a[href="progres.html"]')) {
  const progressLink = document.createElement('a');
  progressLink.href = 'progres.html';
  progressLink.textContent = 'Progres';
  accessHeaderNav.insertBefore(progressLink, accessHeaderNav.lastElementChild);
}
const errorMessages = {
  invalid_state: 'Sesiunea de autentificare a expirat. Încearcă din nou.',
  not_in_guild: 'Contul Discord nu este membru al serverului configurat.',
  oauth: 'Discord nu a putut finaliza autentificarea.',
  session: 'Sesiunea nu a putut fi salvată.'
};

if (params.get('error')) {
  errorBox.hidden = false;
  errorBox.textContent = errorMessages[params.get('error')] || 'Autentificarea a eșuat.';
}

fetch('/api/me', { credentials: 'same-origin' })
  .then(response => response.json())
  .then(me => {
    if (!me.authenticated) {
      statusBox.innerHTML = '<a class="discord-auth-button" href="/auth/discord?return=/access.html"><span>◉</span> Continuă cu Discord</a><small>Site-ul nu primește parola contului tău.</small>';
      return;
    }
    statusBox.innerHTML = `<div class="access-granted"><strong>${me.user.username}</strong><span>Acces curent: Tier ${me.tier}</span><a href="/rase/warrior.html">Deschide ghidurile →</a></div>`;
  })
  .catch(() => {
    statusBox.innerHTML = '<p>Pornește site-ul prin serverul Node pentru a folosi autentificarea.</p>';
  });
