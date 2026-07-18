import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import helmet from 'helmet';
import { protectedGuides } from './server/protected-guides.js';
import { protectedFarmStrategies } from './server/protected-farm.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DISCORD_API = 'https://discord.com/api/v10';
const RACES = new Set(['warrior', 'ninja', 'sura', 'shaman', 'lycan']);

const requiredInProduction = [
  'SESSION_SECRET',
  'DATABASE_URL',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'DISCORD_GUILD_ID',
  'DISCORD_TIER_2_ROLE_ID',
  'DISCORD_TIER_3_ROLE_ID',
  'DISCORD_BOT_TOKEN'
];

if (IS_PRODUCTION) {
  const missing = requiredInProduction.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Lipsesc variabilele obligatorii: ${missing.join(', ')}`);
  if (process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET trebuie să aibă minimum 32 de caractere.');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());

let sessionStore;
if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : undefined
  });
  const PgStore = connectPgSimple(session);
  sessionStore = new PgStore({ pool, tableName: 'user_sessions', createTableIfMissing: true });
} else {
  console.warn('DATABASE_URL nu este setat. Sesiunile locale se pierd la restart.');
}

app.use(session({
  name: 'akira.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

function safeReturnPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/';
}

function accessTier(roles = []) {
  if (process.env.DISCORD_TIER_3_ROLE_ID && roles.includes(process.env.DISCORD_TIER_3_ROLE_ID)) return 3;
  if (process.env.DISCORD_TIER_2_ROLE_ID && roles.includes(process.env.DISCORD_TIER_2_ROLE_ID)) return 2;
  return 1;
}

async function discordRequest(endpoint, token, type = 'Bearer') {
  const response = await fetch(`${DISCORD_API}${endpoint}`, {
    headers: { Authorization: `${type} ${token}` }
  });
  if (!response.ok) {
    const error = new Error(`Discord API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function refreshRoles(req) {
  if (!req.session.user || !process.env.DISCORD_BOT_TOKEN) return;
  const lastCheck = req.session.rolesCheckedAt || 0;
  if (Date.now() - lastCheck < 60_000) return;

  try {
    const member = await discordRequest(
      `/guilds/${process.env.DISCORD_GUILD_ID}/members/${req.session.user.id}`,
      process.env.DISCORD_BOT_TOKEN,
      'Bot'
    );
    req.session.roles = member.roles || [];
    req.session.tier = accessTier(req.session.roles);
    req.session.rolesCheckedAt = Date.now();
  } catch (error) {
    console.error('Reverificarea rolurilor Discord a eșuat:', error.message);
    if (error.status === 404) {
      req.session.roles = [];
      req.session.tier = 1;
      req.session.rolesCheckedAt = Date.now();
    }
  }
}

app.get('/auth/discord', (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_REDIRECT_URI) {
    return res.status(503).send('Autentificarea Discord nu este configurată încă.');
  }

  const state = crypto.randomBytes(24).toString('hex');
  req.session.oauthState = state;
  req.session.returnTo = safeReturnPath(req.query.return);

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get('/auth/discord/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.oauthState) {
    return res.redirect('/access.html?error=invalid_state');
  }

  const returnTo = safeReturnPath(req.session.returnTo);
  delete req.session.oauthState;
  delete req.session.returnTo;

  try {
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      })
    });
    if (!tokenResponse.ok) throw new Error(`Schimbul OAuth a eșuat: ${tokenResponse.status}`);

    const token = await tokenResponse.json();
    const [user, member] = await Promise.all([
      discordRequest('/users/@me', token.access_token),
      discordRequest(`/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`, token.access_token)
    ]);

    const userSession = {
      id: user.id,
      username: user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : null
    };
    const roles = member.roles || [];

    req.session.regenerate(error => {
      if (error) return res.redirect('/access.html?error=session');
      req.session.user = userSession;
      req.session.roles = roles;
      req.session.tier = accessTier(roles);
      req.session.rolesCheckedAt = Date.now();
      req.session.save(() => res.redirect(returnTo));
    });
  } catch (error) {
    console.error('Discord OAuth:', error.message);
    res.redirect(`/access.html?error=${error.status === 404 ? 'not_in_guild' : 'oauth'}`);
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('akira.sid');
    res.status(204).end();
  });
});

app.get('/api/me', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!req.session.user) return res.json({ authenticated: false, tier: 1 });
  await refreshRoles(req);
  res.json({ authenticated: true, user: req.session.user, tier: req.session.tier || 1 });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'akira2-darklegion-guide' });
});

app.get('/api/guides/:race/tier/:tier', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const race = req.params.race.toLowerCase();
  const tier = Number(req.params.tier);
  if (!RACES.has(race) || ![2, 3].includes(tier)) return res.status(404).json({ error: 'Ghid inexistent.' });
  if (!req.session.user) return res.status(401).json({ error: 'Autentificare necesară.' });

  await refreshRoles(req);
  if ((req.session.tier || 1) < tier) return res.status(403).json({ error: 'Rol Discord insuficient.' });
  res.json({ race, tier, guide: protectedGuides[tier] });
});

app.get('/api/farm/tier/:tier', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const tier = Number(req.params.tier);
  if (![2, 3].includes(tier)) return res.status(404).json({ error: 'Strategie inexistentă.' });
  if (!req.session.user) return res.status(401).json({ error: 'Autentificare necesară.' });

  await refreshRoles(req);
  if ((req.session.tier || 1) < tier) return res.status(403).json({ error: 'Rol Discord insuficient.' });
  res.json({ tier, strategy: protectedFarmStrategies[tier] });
});

const publicFiles = new Set([
  'index.html', 'styles.css', 'script.js', 'guide-basics.css', 'guide.js',
  'events.html', 'events.css', 'events.js', 'events-nav.css',
  'regulament.html', 'regulament.css', 'access.html', 'access.css', 'access.js',
  'farm.html', 'farm.css', 'farm.js',
  'race-guide.css', 'race-guide.js', 'tier-guide.css', 'protected-guide.css',
  'auth-ui.js', 'auth-ui.css'
]);

app.use('/assets', express.static(path.join(ROOT, 'assets'), { fallthrough: false }));
app.use('/rase', express.static(path.join(ROOT, 'rase'), { index: false, fallthrough: false }));
app.get('/', (_req, res) => res.sendFile('index.html', { root: ROOT }));
app.get('/:file', (req, res, next) => {
  if (!publicFiles.has(req.params.file)) return next();
  res.sendFile(req.params.file, { root: ROOT });
});
app.use((_req, res) => res.status(404).send('Pagina nu a fost găsită.'));

app.listen(PORT, () => console.log(`Akira2 DarkLegion rulează pe portul ${PORT}`));
