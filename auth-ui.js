(() => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/auth-ui.css';
  document.head.appendChild(css);

  const header = document.querySelector('.site-header, .rules-header, .guide-header, body > header');
  if (!header || header.querySelector('.auth-control')) return;

  const control = document.createElement('div');
  control.className = 'auth-control';
  control.innerHTML = '<span class="auth-loading">Discord…</span>';
  header.appendChild(control);

  const navigation = document.querySelector('.main-nav, .progress-nav, .events-nav, .rules-nav, .guide-nav');
  if (navigation && !navigation.querySelector('a[href="bosses.html"], a[href="/bosses.html"]')) {
    const bossesLink = document.createElement('a');
    bossesLink.href = '/bosses.html';
    bossesLink.textContent = 'Spawn Boși';
    const progressLink = [...navigation.querySelectorAll('a')].find(item => item.getAttribute('href')?.includes('progres'));
    progressLink ? navigation.insertBefore(bossesLink, progressLink) : navigation.appendChild(bossesLink);
  }

  fetch('/api/me', { credentials: 'same-origin' })
    .then(response => response.json())
    .then(me => {
      if (!me.authenticated) {
        const returnTo = encodeURIComponent(location.pathname + location.hash);
        control.innerHTML = `<a class="discord-login" href="/auth/discord?return=${returnTo}"><span>◉</span> Login Discord</a>`;
        return;
      }

      if (me.managedProgressTiers?.length) {
        const nav = document.querySelector('.main-nav, .progress-nav, .events-nav, .rules-nav, .guide-nav');
        if (nav && !nav.querySelector('a[href="responsabil.html"], a[href="/responsabil.html"]')) {
          const link = document.createElement('a');
          link.href = '/responsabil.html';
          link.textContent = 'Responsabili';
          const regulation = [...nav.querySelectorAll('a')].find(item => item.getAttribute('href')?.includes('regulament'));
          regulation ? nav.insertBefore(link, regulation) : nav.appendChild(link);
        }
      }

      const avatar = me.user.avatar
        ? `<img src="${me.user.avatar}" alt="">`
        : '<span class="avatar-fallback">D</span>';
      control.innerHTML = `<div class="discord-user">${avatar}<span><strong>${me.user.username}</strong><small>Acces Tier ${me.tier}</small></span><button type="button" title="Deconectare">↪</button></div>`;
      control.querySelector('button').addEventListener('click', async () => {
        await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
        location.reload();
      });
    })
    .catch(() => {
      control.innerHTML = '<span class="auth-offline">Login disponibil pe Railway</span>';
    });
})();
