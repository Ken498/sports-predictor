const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const https    = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sportspick-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const STATIC = path.join(__dirname, '../src/main/resources/static');
app.use(express.static(STATIC));

// ── Static fallback stats ────────────────────────────────────
const STATIC_STATS = {
  'Manchester City':  { form: ['W','W','W','D','W'], pos: '1st', league: 'Premier League', sport: 'FOOTBALL' },
  'Arsenal':          { form: ['W','W','L','W','D'], pos: '2nd', league: 'Premier League', sport: 'FOOTBALL' },
  'Real Madrid':      { form: ['W','W','W','W','L'], pos: '1st', league: 'La Liga',         sport: 'FOOTBALL' },
  'Barcelona':        { form: ['W','D','W','W','W'], pos: '2nd', league: 'La Liga',         sport: 'FOOTBALL' },
  'PSG':              { form: ['W','W','D','W','W'], pos: '1st', league: 'Ligue 1',         sport: 'FOOTBALL' },
  'Bayern Munich':    { form: ['W','W','W','L','W'], pos: '1st', league: 'Bundesliga',      sport: 'FOOTBALL' },
  'Jon Jones':        { form: ['W','W','W','W','W'], record: '27-1-0', weightClass: 'Heavyweight',  sport: 'UFC' },
  'Stipe Miocic':     { form: ['L','W','W','L','W'], record: '20-4-0', weightClass: 'Heavyweight',  sport: 'UFC' },
  'Islam Makhachev':  { form: ['W','W','W','W','W'], record: '26-1-0', weightClass: 'Lightweight',  sport: 'UFC' },
  'Dustin Poirier':   { form: ['L','W','W','L','W'], record: '30-9-0', weightClass: 'Lightweight',  sport: 'UFC' },
  'Novak Djokovic':   { form: ['W','W','L','W','W'], ranking: 3,  surface: 'All Surfaces', sport: 'TENNIS' },
  'Carlos Alcaraz':   { form: ['W','W','W','W','W'], ranking: 1,  surface: 'Clay Specialist', sport: 'TENNIS' },
  'Iga Swiatek':      { form: ['W','W','W','W','D'], ranking: 1,  surface: 'Clay Specialist', sport: 'TENNIS' },
  'Aryna Sabalenka':  { form: ['W','L','W','W','W'], ranking: 2,  surface: 'Hard Court',  sport: 'TENNIS' },
};

// Live stats cache — upgraded by TheSportsDB at startup
const liveStats = { ...STATIC_STATS };

// ── In-memory DB ─────────────────────────────────────────────
const now = Date.now();
const d   = (days) => new Date(now + days * 86400000).toISOString();
const ago = (mins) => new Date(now - mins * 60000).toISOString();

const db = {
  seq: { users: 200, predictions: 100, comments: 100 },

  matches: [
    { id: 1, sport: 'FOOTBALL', contestant1: 'Manchester City',  contestant2: 'Arsenal',          scheduledAt: d(2),  status: 'UPCOMING' },
    { id: 2, sport: 'FOOTBALL', contestant1: 'Real Madrid',      contestant2: 'Barcelona',         scheduledAt: d(3),  status: 'UPCOMING' },
    { id: 3, sport: 'FOOTBALL', contestant1: 'PSG',              contestant2: 'Bayern Munich',     scheduledAt: d(5),  status: 'UPCOMING' },
    { id: 4, sport: 'UFC',      contestant1: 'Jon Jones',        contestant2: 'Stipe Miocic',      scheduledAt: d(4),  status: 'UPCOMING' },
    { id: 5, sport: 'UFC',      contestant1: 'Islam Makhachev',  contestant2: 'Dustin Poirier',    scheduledAt: d(7),  status: 'UPCOMING' },
    { id: 6, sport: 'TENNIS',   contestant1: 'Novak Djokovic',   contestant2: 'Carlos Alcaraz',    scheduledAt: d(1),  status: 'UPCOMING' },
    { id: 7, sport: 'TENNIS',   contestant1: 'Iga Swiatek',      contestant2: 'Aryna Sabalenka',   scheduledAt: d(6),  status: 'UPCOMING' },
  ],

  users: [
    { id: 1,   username: 'GolazoBoss',     email: 'golazo@example.com',  password: '$2a$10$dummy1hashed' },
    { id: 2,   username: 'TacticalFred',   email: 'fred@example.com',    password: '$2a$10$dummy2hashed' },
    { id: 3,   username: 'ManCityLad',     email: 'mcfc@example.com',    password: '$2a$10$dummy3hashed' },
    { id: 4,   username: 'ArsenalTill',    email: 'arsenal@example.com', password: '$2a$10$dummy4hashed' },
    { id: 5,   username: 'CoachSpotter',   email: 'coach@example.com',   password: '$2a$10$dummy5hashed' },
    { id: 6,   username: 'ViniBro',        email: 'vini@example.com',    password: '$2a$10$dummy6hashed' },
    { id: 7,   username: 'OctagonIQ',      email: 'octagon@example.com', password: '$2a$10$dummy7hashed' },
    { id: 8,   username: 'DiamondBacker',  email: 'diamond@example.com', password: '$2a$10$dummy8hashed' },
    { id: 9,   username: 'ClayCourtKing',  email: 'clay@example.com',    password: '$2a$10$dummy9hashed' },
    { id: 10,  username: 'DjokovicStan',   email: 'nole@example.com',    password: '$2a$10$dummy10hashed' },
    { id: 11,  username: 'StatisticsGuy',  email: 'stats@example.com',   password: '$2a$10$dummy11hashed' },
    { id: 12,  username: 'BundesligaBoss', email: 'bund@example.com',    password: '$2a$10$dummy12hashed' },
    { id: 13,  username: 'MMAScout',       email: 'mma@example.com',     password: '$2a$10$dummy13hashed' },
    { id: 14,  username: 'ServeAce',       email: 'serve@example.com',   password: '$2a$10$dummy14hashed' },
  ],

  predictions: [
    // Match 1: Man City vs Arsenal  — 64% C1, 36% C2
    { id: 1,  userId: 1,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 2,  userId: 2,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 3,  userId: 3,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 4,  userId: 4,  matchId: 1, predictedWinner: 'CONTESTANT2' },
    { id: 5,  userId: 5,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 6,  userId: 6,  matchId: 1, predictedWinner: 'CONTESTANT2' },
    { id: 7,  userId: 7,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 8,  userId: 8,  matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 9,  userId: 9,  matchId: 1, predictedWinner: 'CONTESTANT2' },
    { id: 10, userId: 10, matchId: 1, predictedWinner: 'CONTESTANT1' },
    { id: 11, userId: 11, matchId: 1, predictedWinner: 'CONTESTANT1' },
    // Match 2: Real Madrid vs Barcelona — 55% C1, 45% C2
    { id: 20, userId: 1,  matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 21, userId: 2,  matchId: 2, predictedWinner: 'CONTESTANT2' },
    { id: 22, userId: 3,  matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 23, userId: 4,  matchId: 2, predictedWinner: 'CONTESTANT2' },
    { id: 24, userId: 5,  matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 25, userId: 6,  matchId: 2, predictedWinner: 'CONTESTANT2' },
    { id: 26, userId: 7,  matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 27, userId: 8,  matchId: 2, predictedWinner: 'CONTESTANT2' },
    { id: 28, userId: 9,  matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 29, userId: 10, matchId: 2, predictedWinner: 'CONTESTANT1' },
    { id: 30, userId: 11, matchId: 2, predictedWinner: 'CONTESTANT2' },
    // Match 3: PSG vs Bayern — 42% C1, 58% C2
    { id: 40, userId: 12, matchId: 3, predictedWinner: 'CONTESTANT2' },
    { id: 41, userId: 13, matchId: 3, predictedWinner: 'CONTESTANT1' },
    { id: 42, userId: 14, matchId: 3, predictedWinner: 'CONTESTANT2' },
    { id: 43, userId: 1,  matchId: 3, predictedWinner: 'CONTESTANT2' },
    { id: 44, userId: 2,  matchId: 3, predictedWinner: 'CONTESTANT1' },
    { id: 45, userId: 3,  matchId: 3, predictedWinner: 'CONTESTANT2' },
    { id: 46, userId: 4,  matchId: 3, predictedWinner: 'CONTESTANT2' },
    // Match 4: Jones vs Miocic — 78% C1, 22% C2
    { id: 60, userId: 7,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 61, userId: 8,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 62, userId: 13, matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 63, userId: 1,  matchId: 4, predictedWinner: 'CONTESTANT2' },
    { id: 64, userId: 2,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 65, userId: 3,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 66, userId: 4,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 67, userId: 5,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 68, userId: 6,  matchId: 4, predictedWinner: 'CONTESTANT1' },
    { id: 69, userId: 9,  matchId: 4, predictedWinner: 'CONTESTANT2' },
    // Match 5: Makhachev vs Poirier — 68% C1, 32% C2
    { id: 80, userId: 7,  matchId: 5, predictedWinner: 'CONTESTANT1' },
    { id: 81, userId: 8,  matchId: 5, predictedWinner: 'CONTESTANT2' },
    { id: 82, userId: 13, matchId: 5, predictedWinner: 'CONTESTANT1' },
    { id: 83, userId: 1,  matchId: 5, predictedWinner: 'CONTESTANT1' },
    { id: 84, userId: 2,  matchId: 5, predictedWinner: 'CONTESTANT1' },
    { id: 85, userId: 3,  matchId: 5, predictedWinner: 'CONTESTANT2' },
    { id: 86, userId: 4,  matchId: 5, predictedWinner: 'CONTESTANT1' },
    // Match 6: Djokovic vs Alcaraz — 38% C1, 62% C2
    { id: 100, userId: 9,  matchId: 6, predictedWinner: 'CONTESTANT2' },
    { id: 101, userId: 10, matchId: 6, predictedWinner: 'CONTESTANT1' },
    { id: 102, userId: 14, matchId: 6, predictedWinner: 'CONTESTANT2' },
    { id: 103, userId: 1,  matchId: 6, predictedWinner: 'CONTESTANT2' },
    { id: 104, userId: 2,  matchId: 6, predictedWinner: 'CONTESTANT1' },
    { id: 105, userId: 3,  matchId: 6, predictedWinner: 'CONTESTANT2' },
    { id: 106, userId: 4,  matchId: 6, predictedWinner: 'CONTESTANT2' },
    { id: 107, userId: 5,  matchId: 6, predictedWinner: 'CONTESTANT1' },
    // Match 7: Swiatek vs Sabalenka — 72% C1, 28% C2
    { id: 120, userId: 9,  matchId: 7, predictedWinner: 'CONTESTANT1' },
    { id: 121, userId: 14, matchId: 7, predictedWinner: 'CONTESTANT2' },
    { id: 122, userId: 1,  matchId: 7, predictedWinner: 'CONTESTANT1' },
    { id: 123, userId: 2,  matchId: 7, predictedWinner: 'CONTESTANT1' },
    { id: 124, userId: 3,  matchId: 7, predictedWinner: 'CONTESTANT1' },
    { id: 125, userId: 4,  matchId: 7, predictedWinner: 'CONTESTANT2' },
    { id: 126, userId: 5,  matchId: 7, predictedWinner: 'CONTESTANT1' },
  ],

  comments: [
    // Match 1 — Man City vs Arsenal
    { id: 1,  userId: 1,  username: 'GolazoBoss',     matchId: 1, createdAt: ago(180), content: "Haaland is in insane form right now. City take this one comfortably — 3-1 minimum." },
    { id: 2,  userId: 2,  username: 'TacticalFred',   matchId: 1, createdAt: ago(145), content: "Arsenal's high press has been elite lately. Ødegaard pulling strings in the final third, don't sleep on them." },
    { id: 3,  userId: 3,  username: 'ManCityLad',     matchId: 1, createdAt: ago(110), content: "Been following City all season — they literally don't lose at the Etihad. Safe pick for the treble run." },
    { id: 4,  userId: 4,  username: 'ArsenalTill',    matchId: 1, createdAt: ago(80),  content: "City's xG against Arsenal last season was actually lower than you'd think. Ramsdale kept it tight. Could be a 1-0 to the Gunners." },
    { id: 5,  userId: 5,  username: 'CoachSpotter',   matchId: 1, createdAt: ago(50),  content: "Pure tactical chess match. Guardiola vs Arteta — the student faces the master. Whoever controls the midfield wins this." },
    { id: 6,  userId: 11, username: 'StatisticsGuy',  matchId: 1, createdAt: ago(20),  content: "City have won 7 of their last 8 home games. Arsenal away form is 4W 2D 3L. Numbers say City, but football ignores numbers." },
    // Match 2 — Real Madrid vs Barcelona
    { id: 10, userId: 6,  username: 'ViniBro',        matchId: 2, createdAt: ago(200), content: "Vini Jr dancing past defenders, Bellingham late run from midfield. El Clásico is Madrid's to lose." },
    { id: 11, userId: 2,  username: 'TacticalFred',   matchId: 2, createdAt: ago(160), content: "Barça's midfield has completely transformed. Pedri, Gavi, De Jong — that triangle is absolutely cooking." },
    { id: 12, userId: 11, username: 'StatisticsGuy',  matchId: 2, createdAt: ago(120), content: "Last 6 El Clásicos: Madrid 3W 2D 1L. But 4 of those went to the last 15 minutes. This always goes to the wire." },
    { id: 13, userId: 5,  username: 'CoachSpotter',   matchId: 2, createdAt: ago(60),  content: "Bellingham plays like he's been in Madrid his whole life. Scary talent at 20. He's the difference maker." },
    { id: 14, userId: 3,  username: 'ManCityLad',     matchId: 2, createdAt: ago(25),  content: "Lewandowski has been quiet in big games lately. That's where Barça stall." },
    // Match 3 — PSG vs Bayern
    { id: 20, userId: 12, username: 'BundesligaBoss', matchId: 3, createdAt: ago(220), content: "PSG bought half of world football but still haven't bought a proper defensive structure. Bayern's press will tear them apart." },
    { id: 21, userId: 11, username: 'StatisticsGuy',  matchId: 3, createdAt: ago(170), content: "Kane's Champions League record: 8 goals in 6 games this season. That's just ridiculous." },
    { id: 22, userId: 2,  username: 'TacticalFred',   matchId: 3, createdAt: ago(95),  content: "Mbappé vs Neuer — that's the battle I'm watching. If Mbappé gets in behind, PSG can absolutely steal this." },
    { id: 23, userId: 5,  username: 'CoachSpotter',   matchId: 3, createdAt: ago(35),  content: "Tuchel knows PSG inside out from his time there. He's going to exploit every single weakness." },
    // Match 4 — Jones vs Miocic
    { id: 30, userId: 7,  username: 'OctagonIQ',      matchId: 4, createdAt: ago(300), content: "Jones hasn't been taken down in YEARS. His IQ in the octagon is just on a different level. GOAT fight incoming." },
    { id: 31, userId: 13, username: 'MMAScout',       matchId: 4, createdAt: ago(250), content: "People forget how technical Jones is on the ground. He doesn't need to brawl — he controls distance and grinds you out." },
    { id: 32, userId: 8,  username: 'DiamondBacker',  matchId: 4, createdAt: ago(200), content: "Don't count Stipe out. That right hand is nuclear. ONE shot and it's over. It's always over with Stipe." },
    { id: 33, userId: 1,  username: 'GolazoBoss',     matchId: 4, createdAt: ago(150), content: "Jones at heavyweight is legitimately terrifying. He was already a monster at 205. The size upgrade makes him basically unbeatable." },
    { id: 34, userId: 7,  username: 'OctagonIQ',      matchId: 4, createdAt: ago(90),  content: "Stipe's wrestling defense is elite though. 4 takedown attempts vs Ngannou, stuffed 3. He's prepared for Jones specifically." },
    { id: 35, userId: 13, username: 'MMAScout',       matchId: 4, createdAt: ago(40),  content: "The reach advantage Jones has is criminal. Stipe needs to nullify that in the first two rounds or it's a long night." },
    // Match 5 — Makhachev vs Poirier
    { id: 40, userId: 7,  username: 'OctagonIQ',      matchId: 5, createdAt: ago(190), content: "Makhachev's wrestling is on an entirely different level. Poirier needs to keep it standing and land early to have any chance." },
    { id: 41, userId: 8,  username: 'DiamondBacker',  matchId: 5, createdAt: ago(140), content: "Poirier has the chin and the heart to go 5 rounds. Diamond don't quit. If this goes deep, watch out." },
    { id: 42, userId: 13, username: 'MMAScout',       matchId: 5, createdAt: ago(85),  content: "Islam's jab to takedown combo is like clockwork. Poirier's coaches better have a plan for that specific sequence." },
    { id: 43, userId: 11, username: 'StatisticsGuy',  matchId: 5, createdAt: ago(30),  content: "Makhachev control time per fight: 14 minutes avg. Poirier has never been controlled that long. This might be a rough night." },
    // Match 6 — Djokovic vs Alcaraz
    { id: 50, userId: 9,  username: 'ClayCourtKing',  matchId: 6, createdAt: ago(240), content: "Alcaraz on clay is the most dangerous player in tennis history at his age. That drop shot is absolutely filthy." },
    { id: 51, userId: 10, username: 'DjokovicStan',   matchId: 6, createdAt: ago(190), content: "Nole's mental game at Grand Slams is literally the best ever. 24 slams. When it matters most, he elevates." },
    { id: 52, userId: 14, username: 'ServeAce',       matchId: 6, createdAt: ago(140), content: "This match will go 5 sets. Calling it right now. Neither of these players loses easily." },
    { id: 53, userId: 9,  username: 'ClayCourtKing',  matchId: 6, createdAt: ago(100), content: "Alcaraz has a 78% win rate on clay since turning pro. On his surface, in his form — this is his title to lose." },
    { id: 54, userId: 2,  username: 'TacticalFred',   matchId: 6, createdAt: ago(55),  content: "The contrast in playstyles is incredible. Alcaraz's raw aggression vs Djokovic's surgical precision. Best match of the year." },
    { id: 55, userId: 10, username: 'DjokovicStan',   matchId: 6, createdAt: ago(15),  content: "Djokovic has beaten Alcaraz in their last two Grand Slam meetings. Experience under pressure matters more than clay stats." },
    // Match 7 — Swiatek vs Sabalenka
    { id: 60, userId: 9,  username: 'ClayCourtKing',  matchId: 7, createdAt: ago(180), content: "Swiatek on clay is like Djokovic at the AO — basically unbeatable. Her topspin forehand is a different sport." },
    { id: 61, userId: 14, username: 'ServeAce',       matchId: 7, createdAt: ago(130), content: "Sabalenka's serve is the biggest weapon in women's tennis. 190km/h first serves change everything. Swiatek has to win long rallies." },
    { id: 62, userId: 4,  username: 'ArsenalTill',    matchId: 7, createdAt: ago(80),  content: "Sabalenka has been incredible this year but clay is not her best surface. The slow court takes pace off her groundstrokes." },
    { id: 63, userId: 9,  username: 'ClayCourtKing',  matchId: 7, createdAt: ago(30),  content: "Swiatek's defensive retrieval game is insane. She'll turn defence into offence against Sabalenka's power. Too consistent." },
  ],
};
db.seq.comments = 200;
db.seq.predictions = 200;

// ── TheSportsDB live fetch (background, enhances static stats) ──
const SPORTSDB_NAMES = {
  'PSG': 'Paris Saint-Germain',
  'Barcelona': 'FC Barcelona',
};

function sportsdbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://www.thesportsdb.com/api/v1/json/3/${path}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchLiveForm(teamName) {
  const searchName = SPORTSDB_NAMES[teamName] || teamName;
  try {
    const search = await sportsdbGet(`searchteams.php?t=${encodeURIComponent(searchName)}`);
    const team   = search.teams?.[0];
    if (!team) return;

    const events = await sportsdbGet(`eventslast.php?id=${team.idTeam}`);
    const results = (events.results || []).slice(-5);

    const form = results.map(e => {
      const isHome = e.idHomeTeam === team.idTeam;
      const mine   = parseInt(isHome ? e.intHomeScore : e.intAwayScore);
      const theirs = parseInt(isHome ? e.intAwayScore : e.intHomeScore);
      if (isNaN(mine) || isNaN(theirs)) return '?';
      return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
    });

    if (form.length >= 3) {
      liveStats[teamName] = { ...liveStats[teamName], form, live: true };
      console.log(`  ✓ Live form for ${teamName}: ${form.join(' ')}`);
    }
  } catch(e) {
    /* silently keep static fallback */
  }
}

async function prefetchFootballStats() {
  const teams = ['Manchester City', 'Arsenal', 'Real Madrid', 'Barcelona', 'PSG', 'Bayern Munich'];
  console.log('\n  Fetching live form from TheSportsDB…');
  await Promise.allSettled(teams.map(fetchLiveForm));
}

// ── Auth middleware ────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
};

// ── Auth ──────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3 || username.length > 50)
    return res.status(400).json({ error: 'Username must be 3–50 characters' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (db.users.find(u => u.email === email))
    return res.status(400).json({ error: 'Email already registered' });
  if (db.users.find(u => u.username === username))
    return res.status(400).json({ error: 'Username already taken' });

  const user = { id: db.seq.users++, username, email, password: await bcrypt.hash(password, 10), createdAt: new Date().toISOString() };
  db.users.push(user);
  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username, email: user.email });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(String(password), user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    // Regenerate session to prevent fixation after login
    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session error' });
      req.session.userId = user.id;
      req.session.save(saveErr => {
        if (saveErr) return res.status(500).json({ error: 'Session error' });
        res.json({ id: user.id, username: user.username, email: user.email });
      });
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  res.json({ id: user.id, username: user.username, email: user.email });
});

// ── Matches (includes live stats) ─────────────────────────
app.get('/api/matches', (req, res) => {
  const { sport } = req.query;
  let list = [...db.matches].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  if (sport) list = list.filter(m => m.sport === sport.toUpperCase());

  list = list.map(m => ({
    ...m,
    c1Stats: liveStats[m.contestant1] || null,
    c2Stats: liveStats[m.contestant2] || null,
  }));
  res.json(list);
});

app.get('/api/matches/:id', (req, res) => {
  const match = db.matches.find(m => m.id === parseInt(req.params.id));
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json({
    ...match,
    c1Stats: liveStats[match.contestant1] || null,
    c2Stats: liveStats[match.contestant2] || null,
  });
});

// ── Predictions ────────────────────────────────────────────
app.post('/api/predictions', requireAuth, (req, res) => {
  const { matchId, predictedWinner } = req.body;
  if (!['CONTESTANT1', 'CONTESTANT2'].includes(predictedWinner))
    return res.status(400).json({ error: 'Invalid predictedWinner' });
  const match = db.matches.find(m => m.id === parseInt(matchId));
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const existing = db.predictions.find(p => p.userId === req.session.userId && p.matchId === parseInt(matchId));
  if (existing) {
    existing.predictedWinner = predictedWinner;
    return res.json({ id: existing.id, matchId: existing.matchId, predictedWinner });
  }
  const pred = { id: db.seq.predictions++, userId: req.session.userId, matchId: parseInt(matchId), predictedWinner, createdAt: new Date().toISOString() };
  db.predictions.push(pred);
  res.json({ id: pred.id, matchId: pred.matchId, predictedWinner: pred.predictedWinner });
});

app.get('/api/predictions/match/:matchId', (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const match   = db.matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const preds = db.predictions.filter(p => p.matchId === matchId);
  const total = preds.length;
  const c1    = preds.filter(p => p.predictedWinner === 'CONTESTANT1').length;

  let userPrediction = null;
  if (req.session.userId) {
    const up = preds.find(p => p.userId === req.session.userId);
    if (up) userPrediction = up.predictedWinner;
  }

  res.json({
    total,
    contestant1Percent: total ? Math.round(c1 * 100 / total) : 0,
    contestant2Percent: total ? Math.round((total - c1) * 100 / total) : 0,
    contestant1Name: match.contestant1,
    contestant2Name: match.contestant2,
    userPrediction,
  });
});

app.get('/api/predictions/user', requireAuth, (req, res) => {
  res.json(db.predictions.filter(p => p.userId === req.session.userId));
});

// Batch prediction stats for multiple matches at once
app.post('/api/predictions/batch', (req, res) => {
  const { matchIds } = req.body;
  if (!Array.isArray(matchIds)) return res.status(400).json({ error: 'matchIds must be an array' });

  const result = {};
  for (const id of matchIds) {
    const matchId = parseInt(id);
    const match   = db.matches.find(m => m.id === matchId);
    if (!match) continue;
    const preds = db.predictions.filter(p => p.matchId === matchId);
    const total = preds.length;
    const c1    = preds.filter(p => p.predictedWinner === 'CONTESTANT1').length;
    let userPrediction = null;
    if (req.session.userId) {
      const up = preds.find(p => p.userId === req.session.userId);
      if (up) userPrediction = up.predictedWinner;
    }
    result[matchId] = {
      total,
      contestant1Percent: total ? Math.round(c1 * 100 / total) : 0,
      contestant2Percent: total ? Math.round((total - c1) * 100 / total) : 0,
      userPrediction,
    };
  }
  res.json(result);
});

// ── Comments ───────────────────────────────────────────────
app.post('/api/comments', requireAuth, (req, res) => {
  const { matchId, content } = req.body;
  if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > 1000) return res.status(400).json({ error: 'Comment too long' });
  const match = db.matches.find(m => m.id === parseInt(matchId));
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const user    = db.users.find(u => u.id === req.session.userId);
  const comment = { id: db.seq.comments++, userId: req.session.userId, username: user.username, matchId: parseInt(matchId), content: content.trim(), createdAt: new Date().toISOString() };
  db.comments.push(comment);
  res.json(comment);
});

app.get('/api/comments/match/:matchId', (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const result  = db.comments
    .filter(c => c.matchId === matchId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ id, username, content, createdAt }) => ({ id, username, content, createdAt }));
  res.json(result);
});

// ── Fallback SPA ──────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(STATIC, 'index.html')));

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ⚡  SportsPick running at http://localhost:' + PORT);
  console.log('');
  prefetchFootballStats();
});
