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
  'DISCORD_PROGRESS_ADMIN_ROLE_IDS',
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
let databasePool;
if (process.env.DATABASE_URL) {
  databasePool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : undefined
  });
  const PgStore = connectPgSimple(session);
  sessionStore = new PgStore({ pool: databasePool, tableName: 'user_sessions', createTableIfMissing: true });
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

function canAdminProgress(roles = []) {
  const allowedRoles = (process.env.DISCORD_PROGRESS_ADMIN_ROLE_IDS || '')
    .split(',')
    .map(role => role.trim())
    .filter(Boolean);
  return allowedRoles.some(role => roles.includes(role));
}

function roleIds(variableName) {
  return (process.env[variableName] || '').split(',').map(role => role.trim()).filter(Boolean);
}

function responsibleTiers(roles = []) {
  return [1, 2, 3].filter(tier => roleIds(`DISCORD_TIER_${tier}_RESPONSIBLE_ROLE_IDS`).some(role => roles.includes(role)));
}

function manageableTiers(roles = []) {
  return canAdminProgress(roles) ? [1, 2, 3] : responsibleTiers(roles);
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Autentificare necesară.' });
  next();
}

function requireDatabase(_req, res, next) {
  if (!databasePool) return res.status(503).json({ error: 'Baza de date nu este configurată.' });
  next();
}

function cleanText(value, maxLength = 180) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

const EQUIPMENT_FIELDS = [
  'weapon', 'armor', 'helmet', 'shield', 'bracelet', 'earrings',
  'necklace', 'shoes', 'talisman', 'glove', 'sash', 'pet'
];
const ALCHEMY_FIELDS = ['diamond', 'ruby', 'jade', 'sapphire', 'garnet', 'onyx', 'amethyst'];
const PROGRESS_FIELDS = ['horse', 'biologist', 'mainFarm', 'accounts'];

function normalizeItemSlot(value) {
  if (typeof value === 'string') {
    return { itemId: '', name: cleanText(value), bonuses: '', image: '' };
  }
  return {
    itemId: cleanText(value?.itemId, 80),
    name: cleanText(value?.name, 120),
    bonuses: cleanText(value?.bonuses, 500),
    image: cleanText(value?.image, 220),
    clarity: cleanText(value?.clarity, 30),
    level: cleanNumber(value?.level, 0, 6),
    selectedBonuses: Array.isArray(value?.selectedBonuses)
      ? value.selectedBonuses.slice(0, 3).map(bonus => cleanText(bonus, 50)).filter(Boolean)
      : []
  };
}

function normalizePlayerProfile(body = {}) {
  const equipment = Object.fromEntries(EQUIPMENT_FIELDS.map(field => [field, normalizeItemSlot(body.equipment?.[field])]));
  const alchemy = Object.fromEntries(ALCHEMY_FIELDS.map(field => [field, normalizeItemSlot(body.alchemy?.[field])]));
  const progress = Object.fromEntries(PROGRESS_FIELDS.map(field => [field, cleanText(body.progress?.[field])]));
  return {
    characterName: cleanText(body.characterName, 40),
    race: RACES.has(String(body.race).toLowerCase()) ? String(body.race).toLowerCase() : 'warrior',
    level: cleanNumber(body.level, 1, 120),
    championLevel: cleanNumber(body.championLevel, 0, 30),
    tier: cleanNumber(body.tier, 1, 3),
    equipment,
    alchemy,
    progress,
    notes: cleanText(body.notes, 1200)
  };
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
  if (!req.session.user) return res.json({ authenticated: false, tier: 1, canAdminProgress: false, responsibleTiers: [], managedProgressTiers: [] });
  await refreshRoles(req);
  const roles = req.session.roles || [];
  res.json({
    authenticated: true,
    user: req.session.user,
    tier: req.session.tier || 1,
    canAdminProgress: canAdminProgress(roles),
    responsibleTiers: responsibleTiers(roles),
    managedProgressTiers: manageableTiers(roles)
  });
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

app.get('/api/progress/me', requireLogin, requireDatabase, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const result = await databasePool.query(
      `SELECT profile, updated_at
       FROM player_progress
       WHERE discord_user_id = $1`,
      [req.session.user.id]
    );
    res.json({ user: req.session.user, progress: result.rows[0] || null });
  } catch (error) {
    console.error('Citirea progresului a eșuat:', error.message);
    res.status(500).json({ error: 'Progresul nu a putut fi citit.' });
  }
});

app.put('/api/progress/me', requireLogin, requireDatabase, async (req, res) => {
  const profile = normalizePlayerProfile(req.body);
  if (profile.characterName.length < 2) {
    return res.status(400).json({ error: 'Numele personajului trebuie să aibă minimum 2 caractere.' });
  }

  try {
    const result = await databasePool.query(
      `INSERT INTO player_progress
        (discord_user_id, discord_username, discord_avatar, profile, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (discord_user_id) DO UPDATE SET
         discord_username = EXCLUDED.discord_username,
         discord_avatar = EXCLUDED.discord_avatar,
         profile = EXCLUDED.profile,
         updated_at = NOW()
       RETURNING profile, updated_at`,
      [
        req.session.user.id,
        req.session.user.username,
        req.session.user.avatar,
        JSON.stringify(profile)
      ]
    );
    res.json({ saved: true, progress: result.rows[0] });
  } catch (error) {
    console.error('Salvarea progresului a eșuat:', error.message);
    res.status(500).json({ error: 'Progresul nu a putut fi salvat.' });
  }
});

app.get('/api/progress/all', requireLogin, requireDatabase, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  await refreshRoles(req);
  const tiers = manageableTiers(req.session.roles || []);
  if (!tiers.length) return res.status(403).json({ error: 'Rolul Admin sau Responsabil de Tier este necesar.' });

  try {
    const result = await databasePool.query(
      `SELECT discord_user_id, discord_username, discord_avatar, profile, updated_at
       FROM player_progress
       WHERE COALESCE((profile->>'tier')::int, 1) = ANY($1::int[])
       ORDER BY updated_at DESC`
      , [tiers]
    );
    res.json({ players: result.rows, managedTiers: tiers, isAdmin: canAdminProgress(req.session.roles || []) });
  } catch (error) {
    console.error('Lista progresului a eșuat:', error.message);
    res.status(500).json({ error: 'Lista jucătorilor nu a putut fi încărcată.' });
  }
});

function currentMonday() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - day + 1);
  return now.toISOString().slice(0, 10);
}

function validWeekStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.getUTCDay() !== 1 ? null : String(value);
}

async function managedTaskContext(req, res) {
  await refreshRoles(req);
  const tiers = manageableTiers(req.session.roles || []);
  if (!tiers.length) {
    res.status(403).json({ error: 'Rolul Admin sau Responsabil de Tier este necesar.' });
    return null;
  }
  return { tiers, isAdmin: canAdminProgress(req.session.roles || []) };
}

app.get('/api/weekly-tasks', requireLogin, requireDatabase, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const context = await managedTaskContext(req, res);
  if (!context) return;
  const weekStart = validWeekStart(req.query.week) || currentMonday();
  try {
    const [tasks, players] = await Promise.all([
      databasePool.query(
        `SELECT id, week_start, tier, discord_user_id, discord_username, item_or_woni, quantity, completed, updated_at
         FROM weekly_tasks WHERE week_start = $1 AND tier = ANY($2::int[])
         ORDER BY tier, completed, discord_username, id`,
        [weekStart, context.tiers]
      ),
      databasePool.query(
        `SELECT discord_user_id, discord_username, profile
         FROM player_progress WHERE COALESCE((profile->>'tier')::int, 1) = ANY($1::int[])
         ORDER BY LOWER(discord_username)`,
        [context.tiers]
      )
    ]);
    res.json({ weekStart, tasks: tasks.rows, players: players.rows, managedTiers: context.tiers, isAdmin: context.isAdmin });
  } catch (error) {
    console.error('Citirea taskurilor săptămânale a eșuat:', error.message);
    res.status(500).json({ error: 'Tabelul săptămânal nu a putut fi încărcat.' });
  }
});

app.post('/api/weekly-tasks', requireLogin, requireDatabase, async (req, res) => {
  const context = await managedTaskContext(req, res);
  if (!context) return;
  const weekStart = validWeekStart(req.body.weekStart);
  const tier = cleanNumber(req.body.tier, 1, 3);
  const discordUserId = cleanText(req.body.discordUserId, 30);
  const itemOrWoni = cleanText(req.body.itemOrWoni, 120);
  const quantity = cleanNumber(req.body.quantity, 1, 999999999);
  if (!weekStart || !context.tiers.includes(tier) || !discordUserId || !itemOrWoni) {
    return res.status(400).json({ error: 'Completează corect săptămâna, tierul, jucătorul, itemul și cantitatea.' });
  }
  try {
    const player = await databasePool.query(
      `SELECT discord_username FROM player_progress
       WHERE discord_user_id = $1 AND COALESCE((profile->>'tier')::int, 1) = $2`,
      [discordUserId, tier]
    );
    if (!player.rowCount) return res.status(400).json({ error: 'Jucătorul nu aparține tierului selectat.' });
    const result = await databasePool.query(
      `INSERT INTO weekly_tasks
        (week_start, tier, discord_user_id, discord_username, item_or_woni, quantity, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [weekStart, tier, discordUserId, player.rows[0].discord_username, itemOrWoni, quantity, req.session.user.id]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    console.error('Adăugarea taskului a eșuat:', error.message);
    res.status(500).json({ error: 'Taskul nu a putut fi adăugat.' });
  }
});

app.put('/api/weekly-tasks/:id', requireLogin, requireDatabase, async (req, res) => {
  const context = await managedTaskContext(req, res);
  if (!context) return;
  const id = cleanNumber(req.params.id, 1, Number.MAX_SAFE_INTEGER);
  try {
    const existing = await databasePool.query('SELECT * FROM weekly_tasks WHERE id = $1', [id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Taskul nu există.' });
    if (!context.tiers.includes(existing.rows[0].tier)) return res.status(403).json({ error: 'Nu poți modifica taskurile acestui tier.' });

    const itemOrWoni = cleanText(req.body.itemOrWoni, 120) || existing.rows[0].item_or_woni;
    const quantity = req.body.quantity === undefined ? existing.rows[0].quantity : cleanNumber(req.body.quantity, 1, 999999999);
    const completed = req.body.completed === undefined ? existing.rows[0].completed : Boolean(req.body.completed);
    const result = await databasePool.query(
      `UPDATE weekly_tasks SET item_or_woni = $1, quantity = $2, completed = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [itemOrWoni, quantity, completed, id]
    );
    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Modificarea taskului a eșuat:', error.message);
    res.status(500).json({ error: 'Taskul nu a putut fi modificat.' });
  }
});

app.delete('/api/weekly-tasks/:id', requireLogin, requireDatabase, async (req, res) => {
  const context = await managedTaskContext(req, res);
  if (!context) return;
  const id = cleanNumber(req.params.id, 1, Number.MAX_SAFE_INTEGER);
  try {
    const result = await databasePool.query('DELETE FROM weekly_tasks WHERE id = $1 AND tier = ANY($2::int[]) RETURNING id', [id, context.tiers]);
    if (!result.rowCount) return res.status(404).json({ error: 'Task inexistent sau fără acces.' });
    res.status(204).end();
  } catch (error) {
    console.error('Ștergerea taskului a eșuat:', error.message);
    res.status(500).json({ error: 'Taskul nu a putut fi șters.' });
  }
});

const publicFiles = new Set([
  'index.html', 'styles.css', 'script.js', 'guide-basics.css', 'guide.js',
  'events.html', 'events.css', 'events.js', 'events-nav.css',
  'regulament.html', 'regulament.css', 'access.html', 'access.css', 'access.js',
  'farm.html', 'farm.css', 'farm.js',
  'progres.html', 'progres.css', 'progres-inventory.css', 'progres-ruby.css', 'weekly-tasks.css', 'alchemy-data.js', 'progres.js', 'weekly-tasks.js',
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

async function startServer() {
  if (databasePool) {
    await databasePool.query(`
      CREATE TABLE IF NOT EXISTS player_progress (
        discord_user_id TEXT PRIMARY KEY,
        discord_username TEXT NOT NULL,
        discord_avatar TEXT,
        profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await databasePool.query(`
      CREATE TABLE IF NOT EXISTS weekly_tasks (
        id BIGSERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 3),
        discord_user_id TEXT NOT NULL,
        discord_username TEXT NOT NULL,
        item_or_woni TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await databasePool.query('CREATE INDEX IF NOT EXISTS weekly_tasks_week_tier_idx ON weekly_tasks (week_start, tier)');
  }
  app.listen(PORT, () => console.log(`Akira2 DarkLegion rulează pe portul ${PORT}`));
}

startServer().catch(error => {
  console.error('Serverul nu a putut porni:', error);
  process.exit(1);
});
